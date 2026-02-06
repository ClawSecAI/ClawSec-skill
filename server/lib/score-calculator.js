/**
 * ClawSec Risk Score Calculator
 * Normalizes all scan results to a 0-100 scale with clear thresholds
 * 
 * @version 1.0.0
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 * 
 * Score Calculation Algorithm:
 * - Uses weighted severity scoring with finding count and context
 * - Normalizes to 0-100 scale (0 = perfect security, 100 = critical risk)
 * - Applies diminishing returns for multiple findings (prevents score inflation)
 * - Considers credential exposure, configuration issues, and attack likelihood
 * 
 * Risk Level Thresholds (CVSS v3.x/v4.0 Aligned):
 * - CRITICAL: 90-100 (immediate action required - fix within 24h)
 * - HIGH: 70-89 (urgent remediation needed - fix within 1 week)
 * - MEDIUM: 40-69 (should be addressed soon - fix within 1 month)
 * - LOW: 1-39 (minimal risk, monitor and plan fix)
 * - SECURE: 0 (no issues detected)
 */

/**
 * Severity base scores (0-100 scale)
 * These represent the baseline risk contribution of each severity level
 */
const SEVERITY_WEIGHTS = {
  CRITICAL: 25,  // Each critical finding adds 25 points (max 4 findings = 100)
  HIGH: 15,      // Each high finding adds 15 points
  MEDIUM: 8,     // Each medium finding adds 8 points
  LOW: 3         // Each low finding adds 3 points
};

/**
 * Risk level thresholds (0-100 scale)
 * Aligned with CVSS v3.x/v4.0 standards (NIST/NVD)
 * 
 * Reference: https://nvd.nist.gov/vuln-metrics/cvss
 * - CRITICAL: 9.0-10.0 (90-100%) - Severe issues requiring immediate action
 * - HIGH: 7.0-8.9 (70-89%) - Urgent vulnerabilities needing quick remediation
 * - MEDIUM: 4.0-6.9 (40-69%) - Moderate risks that should be addressed
 * - LOW: 0.1-3.9 (1-39%) - Minor issues with minimal risk
 * - NONE: 0.0 (0%) - No security issues detected
 */
const RISK_THRESHOLDS = {
  CRITICAL: 90,  // Aligned with CVSS v3.x/v4.0 (9.0/10.0)
  HIGH: 70,      // Aligned with CVSS v3.x/v4.0 (7.0/10.0)
  MEDIUM: 40,    // Aligned with CVSS v3.x/v4.0 (4.0/10.0)
  LOW: 1,        // Aligned with CVSS v3.x/v4.0 (0.1/10.0)
  SECURE: 0      // Aligned with CVSS v3.x/v4.0 (0.0/10.0)
};

/**
 * Multipliers for different finding contexts
 * Increases score for findings with higher impact/likelihood
 */
const CONTEXT_MULTIPLIERS = {
  // Likelihood modifiers
  likelihood: {
    HIGH: 1.3,
    MEDIUM: 1.0,
    LOW: 0.7
  },
  
  // Credential exposure is particularly dangerous
  credentialExposure: 1.5,
  
  // Public exposure increases risk
  publicExposure: 1.4,
  
  // Configuration weakness
  weakConfiguration: 1.2
};

/**
 * Diminishing returns curve parameters
 * Prevents score inflation from many low-severity findings
 */
const DIMINISHING_RETURNS = {
  enabled: true,
  factor: 0.85  // Each additional finding contributes 85% of the previous one
};

/**
 * Calculate overall risk score from findings
 * 
 * @param {Array} findings - Array of security findings
 * @param {Object} options - Calculation options
 * @param {string} options.scanType - Type of scan (config, vulnerability, compliance)
 * @param {Object} options.context - Additional context (credential count, public exposure, etc.)
 * @returns {Object} Score object with value, level, and breakdown
 */
function calculateRiskScore(findings = [], options = {}) {
  // Handle empty findings
  if (!findings || findings.length === 0) {
    return {
      score: 0,
      level: 'SECURE',
      confidence: 'high',
      breakdown: {
        baseScore: 0,
        adjustedScore: 0,
        findingsCount: 0,
        severityDistribution: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      }
    };
  }
  
  // Count findings by severity
  const severityCounts = countBySeverity(findings);
  
  // Calculate base score from severity distribution
  const baseScore = calculateBaseScore(severityCounts);
  
  // Apply context multipliers
  const contextMultiplier = calculateContextMultiplier(findings, options);
  
  // Apply adjustments
  let adjustedScore = baseScore * contextMultiplier;
  
  // Apply diminishing returns if enabled
  if (DIMINISHING_RETURNS.enabled && findings.length > 3) {
    adjustedScore = applyDiminishingReturns(adjustedScore, findings.length);
  }
  
  // Clamp score to 0-100 range
  const finalScore = Math.min(100, Math.max(0, Math.round(adjustedScore)));
  
  // Determine risk level from score
  const riskLevel = scoreToRiskLevel(finalScore);
  
  // Calculate confidence based on finding quality
  const confidence = calculateConfidence(findings);
  
  return {
    score: finalScore,
    level: riskLevel,
    confidence,
    breakdown: {
      baseScore: Math.round(baseScore),
      contextMultiplier: Math.round(contextMultiplier * 100) / 100,
      adjustedScore: Math.round(adjustedScore),
      finalScore,
      findingsCount: findings.length,
      severityDistribution: severityCounts,
      appliedFactors: identifyAppliedFactors(findings, options)
    }
  };
}

/**
 * Count findings by severity level
 */
function countBySeverity(findings) {
  return {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length
  };
}

/**
 * Calculate base score from severity distribution
 * Uses weighted sum with diminishing returns per severity level
 */
function calculateBaseScore(severityCounts) {
  let score = 0;
  
  // Calculate score for each severity level with diminishing returns
  Object.keys(severityCounts).forEach(severity => {
    const count = severityCounts[severity];
    const weight = SEVERITY_WEIGHTS[severity.toUpperCase()] || 0;
    
    // Apply diminishing returns within each severity level
    for (let i = 0; i < count; i++) {
      const diminish = Math.pow(DIMINISHING_RETURNS.factor, i);
      score += weight * diminish;
    }
  });
  
  return score;
}

/**
 * Calculate context multiplier based on finding characteristics
 */
function calculateContextMultiplier(findings, options = {}) {
  let multiplier = 1.0;
  
  // Check for credential exposure
  const hasCredentialExposure = findings.some(f => 
    f.threat_id === 'T005' || 
    f.title?.toLowerCase().includes('credential') ||
    f.title?.toLowerCase().includes('secret')
  );
  
  if (hasCredentialExposure) {
    multiplier *= CONTEXT_MULTIPLIERS.credentialExposure;
  }
  
  // Check for public exposure
  const hasPublicExposure = findings.some(f => 
    f.threat_id === 'T002' ||
    f.title?.toLowerCase().includes('public') ||
    f.evidence?.bind_address === '0.0.0.0'
  );
  
  if (hasPublicExposure) {
    multiplier *= CONTEXT_MULTIPLIERS.publicExposure;
  }
  
  // Check for weak configuration
  const hasWeakConfig = findings.some(f => 
    f.threat_id === 'T001' ||
    f.title?.toLowerCase().includes('weak') ||
    f.title?.toLowerCase().includes('default')
  );
  
  if (hasWeakConfig) {
    multiplier *= CONTEXT_MULTIPLIERS.weakConfiguration;
  }
  
  // Apply likelihood-based multipliers
  const highLikelihoodCount = findings.filter(f => f.likelihood === 'HIGH').length;
  const totalFindings = findings.length;
  
  if (highLikelihoodCount / totalFindings > 0.5) {
    multiplier *= CONTEXT_MULTIPLIERS.likelihood.HIGH;
  } else if (highLikelihoodCount / totalFindings > 0.25) {
    multiplier *= CONTEXT_MULTIPLIERS.likelihood.MEDIUM;
  }
  
  return multiplier;
}

/**
 * Apply diminishing returns for high finding counts
 * Prevents score inflation from many minor issues
 */
function applyDiminishingReturns(score, findingCount) {
  // After 3 findings, each additional finding has less impact
  const excessFindings = Math.max(0, findingCount - 3);
  const diminishFactor = Math.pow(0.95, excessFindings);
  
  return score * diminishFactor;
}

/**
 * Convert numeric score to risk level
 */
function scoreToRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (score >= RISK_THRESHOLDS.LOW) return 'LOW';
  return 'SECURE';
}

/**
 * Convert risk level to numeric score range (for reverse calculation)
 */
function riskLevelToScoreRange(level) {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return { min: 90, max: 100 };
    case 'HIGH':
      return { min: 70, max: 89 };
    case 'MEDIUM':
      return { min: 40, max: 69 };
    case 'LOW':
      return { min: 1, max: 39 };
    case 'SECURE':
      return { min: 0, max: 0 };
    default:
      return { min: 0, max: 100 };
  }
}

/**
 * Calculate confidence level in the score
 * Based on finding quality and evidence strength
 */
function calculateConfidence(findings) {
  if (findings.length === 0) return 'high';
  
  // Count findings with strong evidence
  const withEvidence = findings.filter(f => f.evidence && Object.keys(f.evidence).length > 0).length;
  const evidenceRatio = withEvidence / findings.length;
  
  // Count findings with high confidence patterns
  const highConfidence = findings.filter(f => 
    f.confidence === 'high' || 
    f.likelihood === 'HIGH'
  ).length;
  const confidenceRatio = highConfidence / findings.length;
  
  // Combined confidence score
  const combinedScore = (evidenceRatio + confidenceRatio) / 2;
  
  if (combinedScore >= 0.7) return 'high';
  if (combinedScore >= 0.4) return 'medium';
  return 'low';
}

/**
 * Identify which risk factors were applied
 */
function identifyAppliedFactors(findings, options = {}) {
  const factors = [];
  
  // Check for credential exposure
  if (findings.some(f => f.threat_id === 'T005' || f.title?.toLowerCase().includes('credential'))) {
    factors.push({
      name: 'Credential Exposure',
      multiplier: CONTEXT_MULTIPLIERS.credentialExposure,
      description: 'Hardcoded credentials significantly increase risk'
    });
  }
  
  // Check for public exposure
  if (findings.some(f => f.threat_id === 'T002' || f.title?.toLowerCase().includes('public'))) {
    factors.push({
      name: 'Public Exposure',
      multiplier: CONTEXT_MULTIPLIERS.publicExposure,
      description: 'Services exposed to internet increase attack surface'
    });
  }
  
  // Check for weak configuration
  if (findings.some(f => f.threat_id === 'T001' || f.title?.toLowerCase().includes('weak'))) {
    factors.push({
      name: 'Weak Configuration',
      multiplier: CONTEXT_MULTIPLIERS.weakConfiguration,
      description: 'Weak security settings make exploitation easier'
    });
  }
  
  // Check for high likelihood findings
  const highLikelihood = findings.filter(f => f.likelihood === 'HIGH').length;
  if (highLikelihood > findings.length / 2) {
    factors.push({
      name: 'High Likelihood',
      multiplier: CONTEXT_MULTIPLIERS.likelihood.HIGH,
      description: 'Multiple findings have high probability of exploitation'
    });
  }
  
  // Check for diminishing returns application
  if (DIMINISHING_RETURNS.enabled && findings.length > 3) {
    factors.push({
      name: 'Diminishing Returns',
      multiplier: Math.pow(0.95, findings.length - 3),
      description: 'Score adjusted to prevent inflation from many minor issues'
    });
  }
  
  return factors;
}

/**
 * Normalize legacy risk level to 0-100 score
 * For backwards compatibility with existing code
 */
function normalizeLegacyRiskLevel(riskLevel, findingCount = 0) {
  const range = riskLevelToScoreRange(riskLevel);
  
  // Use mid-point of range, adjusted by finding count
  let baseScore = (range.min + range.max) / 2;
  
  // Add variance based on finding count (more findings = higher in range)
  if (findingCount > 0) {
    const variance = (range.max - range.min) * Math.min(findingCount / 10, 0.5);
    baseScore += variance;
  }
  
  return Math.min(range.max, Math.round(baseScore));
}

/**
 * Calculate score for different scan types
 * Allows type-specific weight adjustments
 */
function calculateScoreByType(findings, scanType = 'config') {
  const typeMultipliers = {
    config: 1.0,           // Configuration audits (default)
    vulnerability: 1.2,    // Vulnerability scans (slightly higher weight)
    compliance: 0.9,       // Compliance checks (informational)
    credential: 1.5,       // Credential leak scans (highest priority)
    permissions: 1.1       // Permission audits
  };
  
  const baseResult = calculateRiskScore(findings);
  const multiplier = typeMultipliers[scanType] || 1.0;
  
  // Adjust score based on scan type
  const adjustedScore = Math.min(100, Math.round(baseResult.score * multiplier));
  const adjustedLevel = scoreToRiskLevel(adjustedScore);
  
  return {
    ...baseResult,
    score: adjustedScore,
    level: adjustedLevel,
    scanType,
    typeMultiplier: multiplier,
    breakdown: {
      ...baseResult.breakdown,
      scanType,
      typeMultiplier: multiplier,
      originalScore: baseResult.score
    }
  };
}

/**
 * Generate score summary for reporting
 */
function generateScoreSummary(scoreResult) {
  const { score, level, confidence, breakdown } = scoreResult;
  
  let summary = `**Risk Score**: ${score}/100 (${level})\n`;
  summary += `**Confidence**: ${confidence.toUpperCase()}\n\n`;
  
  summary += `**Score Breakdown**:\n`;
  summary += `- Base Score: ${breakdown.baseScore}\n`;
  summary += `- Context Multiplier: ${breakdown.contextMultiplier}x\n`;
  summary += `- Final Score: ${breakdown.finalScore}\n\n`;
  
  summary += `**Findings Distribution**:\n`;
  summary += `- Critical: ${breakdown.severityDistribution.critical}\n`;
  summary += `- High: ${breakdown.severityDistribution.high}\n`;
  summary += `- Medium: ${breakdown.severityDistribution.medium}\n`;
  summary += `- Low: ${breakdown.severityDistribution.low}\n`;
  
  if (breakdown.appliedFactors && breakdown.appliedFactors.length > 0) {
    summary += `\n**Risk Factors Applied**:\n`;
    breakdown.appliedFactors.forEach(factor => {
      summary += `- ${factor.name} (${factor.multiplier}x): ${factor.description}\n`;
    });
  }
  
  return summary;
}

module.exports = {
  calculateRiskScore,
  calculateScoreByType,
  scoreToRiskLevel,
  riskLevelToScoreRange,
  normalizeLegacyRiskLevel,
  generateScoreSummary,
  SEVERITY_WEIGHTS,
  RISK_THRESHOLDS,
  CONTEXT_MULTIPLIERS
};
