/**
 * ClawSec Recommendation Engine
 * Prioritizes security findings based on severity, exploitability, and business impact
 * 
 * @version 1.0.0
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 * 
 * Prioritization Algorithm:
 * - Severity: Base risk level (CRITICAL/HIGH/MEDIUM/LOW)
 * - Exploitability: Ease of exploitation (likelihood + attack complexity)
 * - Impact: Business/operational consequences
 * - Priority Score: Weighted combination (0-100 scale)
 * 
 * Priority Levels:
 * - P0 (90-100): Fix immediately (within hours)
 * - P1 (70-89): Fix urgently (within days)
 * - P2 (40-69): Fix soon (within weeks)
 * - P3 (1-39): Fix eventually (backlog)
 */

/**
 * Severity weights (base priority contribution)
 * Higher severity = higher base priority
 */
const SEVERITY_WEIGHTS = {
  CRITICAL: 40,  // 40 points for critical severity
  HIGH: 30,      // 30 points for high severity
  MEDIUM: 20,    // 20 points for medium severity
  LOW: 10        // 10 points for low severity
};

/**
 * Exploitability scoring (how easy to exploit)
 * Based on attack likelihood and complexity
 */
const EXPLOITABILITY_FACTORS = {
  // Likelihood of exploitation
  likelihood: {
    HIGH: 30,     // Very likely to be exploited
    MEDIUM: 20,   // Moderate likelihood
    LOW: 10       // Lower likelihood
  },
  
  // Attack complexity (inverse - easier = higher score)
  complexity: {
    LOW: 15,      // Easy to exploit (e.g., no auth required)
    MEDIUM: 10,   // Moderate effort required
    HIGH: 5       // Difficult to exploit
  },
  
  // Prerequisites for exploitation
  prerequisites: {
    NONE: 10,     // No prerequisites (publicly accessible)
    LOCAL: 5,     // Requires local access
    AUTH: 3,      // Requires authentication
    ADMIN: 1      // Requires admin privileges
  }
};

/**
 * Impact scoring (business/operational consequences)
 * Higher impact = higher priority
 */
const IMPACT_FACTORS = {
  // Data confidentiality impact
  confidentiality: {
    CRITICAL: 10,  // Credentials, API keys, private data
    HIGH: 7,       // Sensitive configuration
    MEDIUM: 4,     // Internal information
    LOW: 2         // Public information
  },
  
  // System integrity impact
  integrity: {
    CRITICAL: 10,  // System compromise, code execution
    HIGH: 7,       // Configuration tampering
    MEDIUM: 4,     // Limited modification
    LOW: 2         // Minimal impact
  },
  
  // Service availability impact
  availability: {
    CRITICAL: 10,  // Complete service disruption
    HIGH: 7,       // Significant degradation
    MEDIUM: 4,     // Minor disruption
    LOW: 2         // Negligible impact
  }
};

/**
 * Special priority boosters for specific threat patterns
 * Certain vulnerabilities deserve extra attention
 */
const PRIORITY_BOOSTERS = {
  // Credential exposure gets highest boost
  credentialExposure: 20,
  
  // Public exposure increases priority
  publicExposure: 15,
  
  // Default/weak credentials
  weakCredentials: 15,
  
  // Known CVE with active exploitation
  activeCVE: 25,
  
  // Enables other attacks (pivot point)
  enablesChaining: 10,
  
  // Compliance violation (GDPR, PCI-DSS, etc.)
  complianceViolation: 10,
  
  // No easy mitigation available
  noQuickFix: -5  // Lower priority if fix is complex
};

/**
 * Priority level thresholds
 */
const PRIORITY_THRESHOLDS = {
  P0: 90,   // Critical - fix immediately (hours)
  P1: 70,   // High - fix urgently (days)
  P2: 50,   // Medium - fix soon (weeks)
  P3: 1     // Low - fix eventually (backlog)
};

/**
 * Calculate priority score for a single finding
 * 
 * @param {Object} finding - Security finding object
 * @returns {Object} Priority analysis with score and level
 */
function calculatePriority(finding) {
  // Base severity score
  const severityScore = SEVERITY_WEIGHTS[finding.severity] || 10;
  
  // Exploitability score
  const exploitabilityScore = calculateExploitability(finding);
  
  // Impact score
  const impactScore = calculateImpact(finding);
  
  // Special boosters
  const boosterScore = calculateBoosters(finding);
  
  // Total priority score (max 100)
  const rawScore = severityScore + exploitabilityScore + impactScore + boosterScore;
  const priorityScore = Math.min(100, Math.max(0, rawScore));
  
  // Determine priority level
  const priorityLevel = scoreToPriorityLevel(priorityScore);
  
  // Calculate time-to-fix recommendation
  const timeToFix = getTimeToFix(priorityLevel);
  
  return {
    score: priorityScore,
    level: priorityLevel,
    timeToFix,
    breakdown: {
      severity: severityScore,
      exploitability: exploitabilityScore,
      impact: impactScore,
      boosters: boosterScore,
      total: rawScore,
      normalized: priorityScore
    },
    reasoning: generateReasoning(finding, {
      severityScore,
      exploitabilityScore,
      impactScore,
      boosterScore
    })
  };
}

/**
 * Calculate exploitability score
 */
function calculateExploitability(finding) {
  let score = 0;
  
  // Likelihood score
  const likelihood = finding.likelihood?.toUpperCase() || 'MEDIUM';
  score += EXPLOITABILITY_FACTORS.likelihood[likelihood] || 20;
  
  // Attack complexity (infer from evidence)
  const complexity = inferAttackComplexity(finding);
  score += EXPLOITABILITY_FACTORS.complexity[complexity];
  
  // Prerequisites (infer from threat type)
  const prerequisites = inferPrerequisites(finding);
  score += EXPLOITABILITY_FACTORS.prerequisites[prerequisites];
  
  return score;
}

/**
 * Infer attack complexity from finding characteristics
 */
function inferAttackComplexity(finding) {
  const titleLower = finding.title?.toLowerCase() || '';
  
  // Easy if credentials are exposed or no auth required
  if (finding.threat_id === 'T005' || 
      finding.threat_id === 'T001' ||
      titleLower.includes('weak') ||
      (titleLower.includes('default') && 
       (titleLower.includes('credential') || 
        titleLower.includes('password') || 
        titleLower.includes('token') || 
        titleLower.includes('key')))) {
    return 'LOW';
  }
  
  // Difficult if requires specific conditions
  if (finding.threat_id === 'T003' || 
      finding.likelihood === 'LOW') {
    return 'HIGH';
  }
  
  return 'MEDIUM';
}

/**
 * Infer prerequisites from finding type
 */
function inferPrerequisites(finding) {
  // No prerequisites if publicly exposed
  if (finding.threat_id === 'T002' || 
      finding.evidence?.bind_address === '0.0.0.0' ||
      finding.title?.toLowerCase().includes('public')) {
    return 'NONE';
  }
  
  // Requires admin for tool policy issues
  if (finding.threat_id === 'T003') {
    return 'ADMIN';
  }
  
  // Requires local access for config issues
  if (finding.threat_id === 'T001' || 
      finding.threat_id === 'T004') {
    return 'LOCAL';
  }
  
  return 'LOCAL';
}

/**
 * Calculate impact score based on CIA triad
 */
function calculateImpact(finding) {
  let score = 0;
  
  // Confidentiality impact
  const confidentiality = inferConfidentialityImpact(finding);
  score += IMPACT_FACTORS.confidentiality[confidentiality];
  
  // Integrity impact
  const integrity = inferIntegrityImpact(finding);
  score += IMPACT_FACTORS.integrity[integrity];
  
  // Availability impact
  const availability = inferAvailabilityImpact(finding);
  score += IMPACT_FACTORS.availability[availability];
  
  return score;
}

/**
 * Infer confidentiality impact
 */
function inferConfidentialityImpact(finding) {
  // Critical if credentials exposed
  if (finding.threat_id === 'T005' || 
      finding.threat_id === 'T011' ||
      finding.title?.toLowerCase().includes('credential') ||
      finding.title?.toLowerCase().includes('token') ||
      finding.title?.toLowerCase().includes('secret')) {
    return 'CRITICAL';
  }
  
  // High if unencrypted sensitive data
  if (finding.threat_id === 'T004') {
    return 'HIGH';
  }
  
  // Medium for configuration exposure
  if (finding.threat_id === 'T002') {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Infer integrity impact
 */
function inferIntegrityImpact(finding) {
  // Critical if code execution possible
  if (finding.threat_id === 'T003' ||
      finding.impact?.toLowerCase().includes('execution') ||
      finding.impact?.toLowerCase().includes('compromise')) {
    return 'CRITICAL';
  }
  
  // High if configuration can be modified
  if (finding.threat_id === 'T001' || 
      finding.threat_id === 'T002') {
    return 'HIGH';
  }
  
  return 'MEDIUM';
}

/**
 * Infer availability impact
 */
function inferAvailabilityImpact(finding) {
  // High if DoS possible
  if (finding.threat_id === 'T006' ||
      finding.impact?.toLowerCase().includes('denial') ||
      finding.impact?.toLowerCase().includes('exhaustion')) {
    return 'HIGH';
  }
  
  // Medium if service disruption possible
  if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Calculate priority boosters
 */
function calculateBoosters(finding) {
  let score = 0;
  const titleLower = finding.title?.toLowerCase() || '';
  
  // Credential exposure booster
  if (finding.threat_id === 'T005' || 
      finding.threat_id === 'T011' ||
      titleLower.includes('credential') ||
      titleLower.includes('secret')) {
    score += PRIORITY_BOOSTERS.credentialExposure;
  }
  
  // Public exposure booster
  if (finding.threat_id === 'T002' || 
      finding.evidence?.bind_address === '0.0.0.0' ||
      titleLower.includes('public')) {
    score += PRIORITY_BOOSTERS.publicExposure;
  }
  
  // Weak credentials booster - only for credential-related defaults
  if (finding.threat_id === 'T001' ||
      titleLower.includes('weak') ||
      (titleLower.includes('default') && 
       (titleLower.includes('credential') || 
        titleLower.includes('password') || 
        titleLower.includes('token') || 
        titleLower.includes('key')))) {
    score += PRIORITY_BOOSTERS.weakCredentials;
  }
  
  // Enables chaining booster (if this enables other attacks)
  if (finding.threat_id === 'T003' ||  // Unrestricted exec enables many attacks
      finding.threat_id === 'T001') {   // Weak token enables full access
    score += PRIORITY_BOOSTERS.enablesChaining;
  }
  
  // Quick fix penalty (complex remediations get lower priority)
  const hasQuickFix = finding.remediation?.immediate?.length > 0;
  if (!hasQuickFix || finding.remediation.immediate.length > 5) {
    score += PRIORITY_BOOSTERS.noQuickFix;
  }
  
  return score;
}

/**
 * Convert priority score to level
 */
function scoreToPriorityLevel(score) {
  if (score >= PRIORITY_THRESHOLDS.P0) return 'P0';
  if (score >= PRIORITY_THRESHOLDS.P1) return 'P1';
  if (score >= PRIORITY_THRESHOLDS.P2) return 'P2';
  return 'P3';
}

/**
 * Get time-to-fix recommendation
 */
function getTimeToFix(level) {
  const timeframes = {
    P0: {
      deadline: 'Fix immediately',
      duration: 'Within hours',
      urgency: 'CRITICAL'
    },
    P1: {
      deadline: 'Fix urgently',
      duration: 'Within 1-3 days',
      urgency: 'HIGH'
    },
    P2: {
      deadline: 'Fix soon',
      duration: 'Within 1-2 weeks',
      urgency: 'MEDIUM'
    },
    P3: {
      deadline: 'Fix eventually',
      duration: 'Backlog (schedule within month)',
      urgency: 'LOW'
    }
  };
  
  return timeframes[level] || timeframes.P3;
}

/**
 * Generate human-readable reasoning for priority
 */
function generateReasoning(finding, scores) {
  const reasons = [];
  
  // Severity reasoning
  reasons.push(`${finding.severity} severity baseline (+${scores.severityScore} points)`);
  
  // Exploitability reasoning
  if (scores.exploitabilityScore >= 50) {
    reasons.push(`High exploitability: ${finding.likelihood || 'MEDIUM'} likelihood (+${scores.exploitabilityScore} points)`);
  } else {
    reasons.push(`Moderate exploitability (+${scores.exploitabilityScore} points)`);
  }
  
  // Impact reasoning
  if (scores.impactScore >= 25) {
    reasons.push(`High business impact: affects confidentiality/integrity/availability (+${scores.impactScore} points)`);
  }
  
  // Booster reasoning
  if (scores.boosterScore > 0) {
    const boosterReasons = [];
    if (finding.threat_id === 'T005' || finding.title?.toLowerCase().includes('credential')) {
      boosterReasons.push('credential exposure');
    }
    if (finding.threat_id === 'T002' || finding.title?.toLowerCase().includes('public')) {
      boosterReasons.push('public exposure');
    }
    if (finding.threat_id === 'T001' || finding.title?.toLowerCase().includes('weak')) {
      boosterReasons.push('weak security controls');
    }
    if (boosterReasons.length > 0) {
      reasons.push(`Priority boosters: ${boosterReasons.join(', ')} (+${scores.boosterScore} points)`);
    }
  }
  
  return reasons.join('; ');
}

/**
 * Prioritize and rank all findings
 * 
 * @param {Array} findings - Array of security findings
 * @param {Object} options - Prioritization options
 * @returns {Object} Prioritized findings with ranking
 */
function prioritizeFindings(findings = [], options = {}) {
  if (!findings || findings.length === 0) {
    return {
      rankings: [],
      summary: {
        total: 0,
        byPriority: { P0: 0, P1: 0, P2: 0, P3: 0 },
        recommendations: []
      }
    };
  }
  
  // Calculate priority for each finding
  const withPriorities = findings.map(finding => {
    const priority = calculatePriority(finding);
    return {
      ...finding,
      priority
    };
  });
  
  // Sort by priority score (highest first)
  const ranked = withPriorities.sort((a, b) => 
    b.priority.score - a.priority.score
  );
  
  // Group by priority level
  const byPriority = {
    P0: ranked.filter(f => f.priority.level === 'P0'),
    P1: ranked.filter(f => f.priority.level === 'P1'),
    P2: ranked.filter(f => f.priority.level === 'P2'),
    P3: ranked.filter(f => f.priority.level === 'P3')
  };
  
  // Generate actionable recommendations
  const recommendations = generateRecommendations(byPriority);
  
  return {
    rankings: ranked,
    summary: {
      total: findings.length,
      byPriority: {
        P0: byPriority.P0.length,
        P1: byPriority.P1.length,
        P2: byPriority.P2.length,
        P3: byPriority.P3.length
      },
      recommendations
    },
    grouped: byPriority
  };
}

/**
 * Generate actionable recommendations based on prioritized findings
 */
function generateRecommendations(byPriority) {
  const recommendations = [];
  
  // P0 recommendations (immediate action)
  if (byPriority.P0.length > 0) {
    recommendations.push({
      priority: 'P0',
      action: 'IMMEDIATE ACTION REQUIRED',
      tasks: byPriority.P0.map((f, i) => ({
        order: i + 1,
        title: f.title,
        deadline: 'Within hours',
        steps: f.remediation?.immediate || [],
        reasoning: f.priority.reasoning
      }))
    });
  }
  
  // P1 recommendations (urgent)
  if (byPriority.P1.length > 0) {
    recommendations.push({
      priority: 'P1',
      action: 'URGENT REMEDIATION',
      tasks: byPriority.P1.map((f, i) => ({
        order: i + 1,
        title: f.title,
        deadline: 'Within 1-3 days',
        steps: f.remediation?.immediate || f.remediation?.short_term || [],
        reasoning: f.priority.reasoning
      }))
    });
  }
  
  // P2 recommendations (schedule soon)
  if (byPriority.P2.length > 0) {
    recommendations.push({
      priority: 'P2',
      action: 'SCHEDULE REMEDIATION',
      tasks: byPriority.P2.map((f, i) => ({
        order: i + 1,
        title: f.title,
        deadline: 'Within 1-2 weeks',
        steps: f.remediation?.short_term || [],
        reasoning: f.priority.reasoning
      }))
    });
  }
  
  // P3 recommendations (backlog)
  if (byPriority.P3.length > 0) {
    recommendations.push({
      priority: 'P3',
      action: 'BACKLOG ITEMS',
      tasks: byPriority.P3.map((f, i) => ({
        order: i + 1,
        title: f.title,
        deadline: 'Within 1 month',
        steps: f.remediation?.long_term || [],
        reasoning: f.priority.reasoning
      }))
    });
  }
  
  return recommendations;
}

/**
 * Generate prioritized recommendations report section
 */
function generatePriorityReport(prioritized) {
  const { summary, grouped } = prioritized;
  
  let report = `## 🎯 Prioritized Recommendations\n\n`;
  report += `Based on severity, exploitability, and business impact, here are your prioritized action items:\n\n`;
  
  // Priority distribution
  report += `### Priority Distribution\n\n`;
  report += `| Priority | Count | Timeline | Action Required |\n`;
  report += `|----------|-------|----------|----------------|\n`;
  report += `| 🔴 P0 (Critical) | ${summary.byPriority.P0} | Hours | Fix immediately |\n`;
  report += `| 🟠 P1 (High) | ${summary.byPriority.P1} | 1-3 Days | Fix urgently |\n`;
  report += `| 🟡 P2 (Medium) | ${summary.byPriority.P2} | 1-2 Weeks | Schedule fix |\n`;
  report += `| 🟢 P3 (Low) | ${summary.byPriority.P3} | 1 Month | Backlog |\n`;
  report += `| **Total** | **${summary.total}** | - | - |\n\n`;
  
  // P0 recommendations (if any)
  if (grouped.P0.length > 0) {
    report += `### 🚨 P0 - IMMEDIATE ACTION REQUIRED\n\n`;
    report += `**Timeline**: Fix within hours\n`;
    report += `**Impact**: Critical risk to system security\n\n`;
    
    grouped.P0.forEach((finding, i) => {
      report += `#### ${i + 1}. ${finding.title}\n\n`;
      report += `**Priority Score**: ${finding.priority.score}/100\n`;
      report += `**Severity**: ${finding.severity} | **Exploitability**: ${finding.likelihood || 'MEDIUM'}\n`;
      report += `**Why this is P0**: ${finding.priority.reasoning}\n\n`;
      
      if (finding.remediation?.immediate) {
        report += `**Fix now**:\n`;
        finding.remediation.immediate.forEach(step => {
          report += `- [ ] ${step}\n`;
        });
        report += `\n`;
      }
    });
    
    report += `---\n\n`;
  }
  
  // P1 recommendations (if any)
  if (grouped.P1.length > 0) {
    report += `### 🟠 P1 - URGENT REMEDIATION\n\n`;
    report += `**Timeline**: Fix within 1-3 days\n`;
    report += `**Impact**: High risk requiring prompt attention\n\n`;
    
    grouped.P1.forEach((finding, i) => {
      report += `#### ${i + 1}. ${finding.title}\n\n`;
      report += `**Priority Score**: ${finding.priority.score}/100\n`;
      report += `**Reasoning**: ${finding.priority.reasoning}\n\n`;
      
      if (finding.remediation?.immediate || finding.remediation?.short_term) {
        const steps = finding.remediation.immediate || finding.remediation.short_term;
        report += `**Action steps**:\n`;
        steps.forEach(step => {
          report += `- [ ] ${step}\n`;
        });
        report += `\n`;
      }
    });
    
    report += `---\n\n`;
  }
  
  // P2 recommendations (if any)
  if (grouped.P2.length > 0) {
    report += `### 🟡 P2 - SCHEDULE REMEDIATION\n\n`;
    report += `**Timeline**: Fix within 1-2 weeks\n`;
    report += `**Impact**: Moderate risk, should be addressed\n\n`;
    
    grouped.P2.slice(0, 5).forEach((finding, i) => {  // Show top 5
      report += `${i + 1}. **${finding.title}** (Score: ${finding.priority.score}/100)\n`;
      report += `   - ${finding.priority.reasoning}\n\n`;
    });
    
    if (grouped.P2.length > 5) {
      report += `*... and ${grouped.P2.length - 5} more P2 items*\n\n`;
    }
    
    report += `---\n\n`;
  }
  
  // P3 summary (if any)
  if (grouped.P3.length > 0) {
    report += `### 🟢 P3 - BACKLOG ITEMS\n\n`;
    report += `**Timeline**: Address within 1 month\n`;
    report += `**Impact**: Low risk, monitor and plan\n\n`;
    report += `${grouped.P3.length} low-priority items identified. Review detailed findings below for complete list.\n\n`;
    report += `---\n\n`;
  }
  
  return report;
}

module.exports = {
  calculatePriority,
  prioritizeFindings,
  generatePriorityReport,
  SEVERITY_WEIGHTS,
  EXPLOITABILITY_FACTORS,
  IMPACT_FACTORS,
  PRIORITY_BOOSTERS,
  PRIORITY_THRESHOLDS
};
