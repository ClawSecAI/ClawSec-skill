/**
 * Job Queue System for Async Report Processing
 * 
 * Provides in-memory job queue for handling long-running scans asynchronously.
 * In production, use Redis Queue (Bull) or AWS SQS for persistence and scaling.
 */

const EventEmitter = require('events');

/**
 * Job status states
 */
const JobStatus = {
  PENDING: 'pending',      // Job created, waiting to process
  PROCESSING: 'processing', // Currently being processed
  COMPLETED: 'completed',   // Successfully completed
  FAILED: 'failed',         // Failed with error
  CANCELLED: 'cancelled'    // Manually cancelled
};

/**
 * In-memory job queue
 * Stores job metadata and results
 */
class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.maxRetries = 3;
    this.ttl = 3600000; // 1 hour TTL for completed jobs
    
    // Start cleanup worker
    this.startCleanup();
  }
  
  /**
   * Create a new job
   */
  createJob(jobId, data = {}) {
    const job = {
      id: jobId,
      status: JobStatus.PENDING,
      data,
      result: null,
      error: null,
      progress: 0,
      retries: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + this.ttl).toISOString()
    };
    
    this.jobs.set(jobId, job);
    this.emit('job:created', job);
    
    return job;
  }
  
  /**
   * Get job by ID
   */
  getJob(jobId) {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }
    
    // Check if expired
    if (new Date(job.expiresAt) < new Date()) {
      this.jobs.delete(jobId);
      return null;
    }
    
    return job;
  }
  
  /**
   * Update job status
   */
  updateStatus(jobId, status, metadata = {}) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.status = status;
    
    if (status === JobStatus.PROCESSING && !job.startedAt) {
      job.startedAt = new Date().toISOString();
    }
    
    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      job.completedAt = new Date().toISOString();
    }
    
    // Merge additional metadata
    Object.assign(job, metadata);
    
    this.emit(`job:${status}`, job);
    
    return true;
  }
  
  /**
   * Update job progress (0-100)
   */
  updateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.progress = Math.min(100, Math.max(0, progress));
    this.emit('job:progress', job);
    
    return true;
  }
  
  /**
   * Complete a job with result
   */
  completeJob(jobId, result) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.status = JobStatus.COMPLETED;
    job.result = result;
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    
    this.emit('job:completed', job);
    
    return true;
  }
  
  /**
   * Fail a job with error
   */
  failJob(jobId, error) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.retries++;
    
    // Check if should retry
    if (job.retries < this.maxRetries) {
      job.status = JobStatus.PENDING;
      job.error = error;
      this.emit('job:retry', job);
    } else {
      job.status = JobStatus.FAILED;
      job.error = error;
      job.completedAt = new Date().toISOString();
      this.emit('job:failed', job);
    }
    
    return true;
  }
  
  /**
   * Cancel a job
   */
  cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      return false; // Can't cancel finished jobs
    }
    
    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date().toISOString();
    
    this.emit('job:cancelled', job);
    
    return true;
  }
  
  /**
   * List all jobs (with optional filtering)
   */
  listJobs(filter = {}) {
    const jobs = Array.from(this.jobs.values());
    
    if (filter.status) {
      return jobs.filter(job => job.status === filter.status);
    }
    
    return jobs;
  }
  
  /**
   * Get queue statistics
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      cancelled: jobs.filter(j => j.status === JobStatus.CANCELLED).length
    };
  }
  
  /**
   * Clean up expired jobs
   */
  cleanup() {
    const now = new Date();
    let cleaned = 0;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (new Date(job.expiresAt) < now) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired job(s)`);
    }
    
    return cleaned;
  }
  
  /**
   * Start periodic cleanup worker
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, 300000); // Every 5 minutes
  }
}

/**
 * Process a scan job asynchronously
 */
async function processScanJob(jobQueue, jobId, scanInput, analyzeFunction, generateReportFunction) {
  try {
    // Update status to processing
    jobQueue.updateStatus(jobId, JobStatus.PROCESSING);
    jobQueue.updateProgress(jobId, 10);
    
    // Load threat database
    const threatsIndex = require('./load-threats')(); // Assume we extract this to a helper
    jobQueue.updateProgress(jobId, 30);
    
    // Analyze configuration
    const findings = analyzeFunction(scanInput, threatsIndex);
    jobQueue.updateProgress(jobId, 60);
    
    // Calculate risk score
    const { calculateRiskScore } = require('./lib/score-calculator');
    const scoreResult = calculateRiskScore(findings, { scanType: 'config' });
    jobQueue.updateProgress(jobId, 70);
    
    // Prioritize findings
    const { prioritizeFindings } = require('./lib/recommendation-engine');
    const prioritized = prioritizeFindings(findings, { scanType: 'config' });
    jobQueue.updateProgress(jobId, 80);
    
    // Generate report
    const report = generateReportFunction(jobId, scanInput, findings, threatsIndex, scoreResult, prioritized);
    jobQueue.updateProgress(jobId, 90);
    
    // Complete job
    const result = {
      scan_id: jobId,
      timestamp: new Date().toISOString(),
      report: report,
      findings_count: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      score_confidence: scoreResult.confidence,
      findings: findings,
      prioritized_recommendations: prioritized ? {
        summary: prioritized.summary,
        rankings: prioritized.rankings
      } : null
    };
    
    jobQueue.completeJob(jobId, result);
    jobQueue.updateProgress(jobId, 100);
    
    return result;
    
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    jobQueue.failJob(jobId, {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Global job queue instance
const jobQueue = new JobQueue();

module.exports = {
  JobQueue,
  JobStatus,
  jobQueue,
  processScanJob
};
