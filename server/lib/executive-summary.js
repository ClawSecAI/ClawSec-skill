/**
 * ClawSec Executive Summary Generator
 * Transforms detailed security findings into concise, business-friendly summaries
 * 
 * @version 1.0.0
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 * 
 * Purpose:
 * - Generate 3-5 bullet points for executive audience
 * - Use non-technical, business-friendly language
 * - Highlight business impact over technical details
 * - Provide clear, actionable recommendations
 * 
 * Target Audience:
 * - C-suite executives (CEO, CTO, CISO)
 * - Board members
 * - Business stakeholders
 * - Non-technical decision makers
 */

/**
 * Business impact mapping for technical threats
 * Translates technical risks into business consequences
 */
const BUSINESS_IMPACT_MAP = {
  'T001': { // Weak Gateway Token
    impact: 'unauthorized access to company systems',
    consequence: 'data breach or operational disruption',
    priority: 'immediate'
  },
  'T002': { // Public Gateway Exposure
    impact: 'system accessible from the internet',
    consequence: 'potential ransomware or data theft',
    priority: 'urgent'
  },
  'T003': { // Unrestricted Tool Execution
    impact: 'uncontrolled system commands',
    consequence: 'system compromise or data loss',
    priority: 'urgent'
  },
  'T004': { // Unencrypted Session Storage
    impact: 'sensitive conversations stored unprotected',
    consequence: 'privacy violations or compliance breaches',
    priority: 'high'
  },
  'T005': { // Exposed Secrets
    impact: 'login credentials and API keys exposed',
    consequence: 'unauthorized cloud spending or data access',
    priority: 'immediate'
  },
  'T006': { // No Rate Limiting
    impact: 'system vulnerable to automated attacks',
    consequence: 'service downtime or resource abuse',
    priority: 'medium'
  },
  'T008': { // Default Port
    impact: 'system easier to discover by attackers',
    consequence: 'increased reconnaissance risk',
    priority: 'low'
  },
  'T011': { // Telegram Bot Token
    impact: 'communication channel credentials exposed',
    consequence: 'message interception or impersonation',
    priority: 'high'
  },
  'T012': { // No Chat Whitelist
    impact: 'anyone can interact with the system',
    consequence: 'unauthorized access or resource abuse',
    priority: 'medium'
  }
};

/**
 * Risk level translations for business audience
 */
const BUSINESS_RISK_LEVELS = {
  CRITICAL: {
    label: 'Critical Business Risk',
    description: 'requires immediate action to prevent security incident',
    timeframe: 'within 24 hours'
  },
  HIGH: {
    label: 'Significant Risk',
    description: 'should be addressed urgently to protect operations',
    timeframe: 'within 1 week'
  },
  MEDIUM: {
    label: 'Moderate Risk',
    description: 'should be planned for remediation soon',
    timeframe: 'within 1 month'
  },
  LOW: {
    label: 'Minor Risk',
    description: 'can be addressed during regular maintenance',
    timeframe: 'within 3 months'
  },
  SECURE: {
    label: 'Secure',
    description: 'no significant risks detected',
    timeframe: 'no action required'
  }
};

/**
 * Generate executive summary from detailed findings
 * 
 * @param {Array} findings - Array of security findings
 * @param {Object} scoreResult - Risk score calculation result
 * @param {Object} options - Generation options
 * @returns {Object} Executive summary with bullet points
 */
function generateExecutiveSummary(findings = [], scoreResult = {}, options = {}) {
  const {
    maxBullets = 5,
    includeRecommendations = true,
    focusOnCritical = true
  } = options;
  
  // Handle secure configuration (no findings)
  if (findings.length === 0) {
    return {
      summary: 'Your security configuration meets industry best practices with no significant risks identified.',
      bullets: [
        '✅ All security controls are properly configured',
        '✅ No exposed credentials or sensitive information detected',
        '✅ System follows recommended security standards',
        '📊 Recommended: Schedule quarterly security reviews to maintain this posture'
      ],
      risk_level: 'SECURE',
      confidence: 'high'
    };
  }
  
  // Prioritize findings
  const prioritizedFindings = prioritizeFindings(findings, focusOnCritical);
  
  // Generate bullet points
  const bullets = generateBulletPoints(prioritizedFindings, scoreResult, maxBullets);
  
  // Generate overall summary statement
  const summaryStatement = generateSummaryStatement(findings, scoreResult);
  
  // Add recommendations if requested
  if (includeRecommendations) {
    const recommendations = generateRecommendations(prioritizedFindings, scoreResult);
    bullets.push(...recommendations);
  }
  
  // Trim to max bullets
  const finalBullets = bullets.slice(0, maxBullets);
  
  return {
    summary: summaryStatement,
    bullets: finalBullets,
    risk_level: scoreResult.level || 'MEDIUM',
    confidence: scoreResult.confidence || 'medium',
    total_issues: findings.length,
    critical_issues: findings.filter(f => f.severity === 'CRITICAL').length,
    high_issues: findings.filter(f => f.severity === 'HIGH').length
  };
}

/**
 * Prioritize findings by business impact
 */
function prioritizeFindings(findings, focusOnCritical = true) {
  // Group by severity
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');
  const medium = findings.filter(f => f.severity === 'MEDIUM');
  const low = findings.filter(f => f.severity === 'LOW');
  
  // If focusing on critical, return only critical and high
  if (focusOnCritical) {
    return [...critical, ...high, ...medium].slice(0, 5);
  }
  
  // Otherwise, return representative sample
  return [
    ...critical.slice(0, 2),
    ...high.slice(0, 2),
    ...medium.slice(0, 1)
  ];
}

/**
 * Generate business-friendly bullet points
 */
function generateBulletPoints(findings, scoreResult, maxBullets = 5) {
  const bullets = [];
  
  // Group similar findings
  const grouped = groupSimilarFindings(findings);
  
  for (const [category, categoryFindings] of Object.entries(grouped)) {
    if (bullets.length >= maxBullets - 1) break; // Reserve space for recommendation
    
    const finding = categoryFindings[0]; // Use first finding as representative
    const count = categoryFindings.length;
    const impact = BUSINESS_IMPACT_MAP[finding.threat_id] || {
      impact: 'security configuration issue detected',
      consequence: 'potential security risk',
      priority: 'medium'
    };
    
    // Format bullet based on severity
    const emoji = getSeverityEmoji(finding.severity);
    const verb = count > 1 ? 'issues' : 'issue';
    const countText = count > 1 ? ` (${count} ${verb})` : '';
    
    let bullet = `${emoji} **${translateToBusinessLanguage(finding.title)}**${countText} - `;
    bullet += `${capitalizeFirst(impact.impact)}, which could lead to ${impact.consequence}.`;
    
    bullets.push(bullet);
  }
  
  return bullets;
}

/**
 * Group similar findings by category
 */
function groupSimilarFindings(findings) {
  const groups = {
    credentials: [],
    access: [],
    configuration: [],
    monitoring: [],
    other: []
  };
  
  findings.forEach(finding => {
    if (finding.threat_id === 'T005' || finding.title?.toLowerCase().includes('credential') || finding.title?.toLowerCase().includes('secret')) {
      groups.credentials.push(finding);
    } else if (finding.threat_id === 'T002' || finding.threat_id === 'T012' || finding.title?.toLowerCase().includes('public') || finding.title?.toLowerCase().includes('whitelist')) {
      groups.access.push(finding);
    } else if (finding.threat_id === 'T001' || finding.threat_id === 'T003' || finding.title?.toLowerCase().includes('weak') || finding.title?.toLowerCase().includes('default')) {
      groups.configuration.push(finding);
    } else if (finding.threat_id === 'T006' || finding.title?.toLowerCase().includes('rate limit') || finding.title?.toLowerCase().includes('monitoring')) {
      groups.monitoring.push(finding);
    } else {
      groups.other.push(finding);
    }
  });
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length > 0)
  );
}

/**
 * Generate overall summary statement
 */
function generateSummaryStatement(findings, scoreResult) {
  const riskLevel = scoreResult.level || 'MEDIUM';
  const score = scoreResult.score || 50;
  const businessRisk = BUSINESS_RISK_LEVELS[riskLevel] || BUSINESS_RISK_LEVELS.MEDIUM;
  
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const totalCount = findings.length;
  
  // Construct business-friendly summary
  let summary = `Security review identified ${totalCount} ${totalCount === 1 ? 'area' : 'areas'} requiring attention`;
  
  if (criticalCount > 0) {
    summary += `, including ${criticalCount} ${criticalCount === 1 ? 'issue' : 'issues'} requiring immediate action`;
  } else if (highCount > 0) {
    summary += `, including ${highCount} ${highCount === 1 ? 'issue' : 'issues'} requiring urgent attention`;
  }
  
  summary += `. Overall risk level: **${businessRisk.label}** (${score}/100) - ${businessRisk.description}.`;
  
  return summary;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(findings, scoreResult) {
  const recommendations = [];
  const riskLevel = scoreResult.level || 'MEDIUM';
  const businessRisk = BUSINESS_RISK_LEVELS[riskLevel] || BUSINESS_RISK_LEVELS.MEDIUM;
  
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  
  // Primary recommendation based on risk level
  if (criticalCount > 0) {
    recommendations.push(
      `🎯 **Recommended Action**: Address ${criticalCount} critical ${criticalCount === 1 ? 'issue' : 'issues'} ${businessRisk.timeframe} to prevent potential security incidents.`
    );
  } else if (highCount > 0) {
    recommendations.push(
      `🎯 **Recommended Action**: Prioritize ${highCount} high-risk ${highCount === 1 ? 'item' : 'items'} ${businessRisk.timeframe} to reduce business exposure.`
    );
  } else {
    recommendations.push(
      `🎯 **Recommended Action**: Schedule remediation of identified issues ${businessRisk.timeframe} during regular maintenance windows.`
    );
  }
  
  // Secondary recommendation for ongoing security
  if (findings.length > 3) {
    recommendations.push(
      `📊 **Ongoing**: Implement automated security scanning to catch similar issues before they reach production.`
    );
  }
  
  return recommendations;
}

/**
 * Translate technical titles to business-friendly language
 */
function translateToBusinessLanguage(technicalTitle) {
  const translations = {
    'Weak or Default Gateway Token': 'Weak system access password',
    'Public Gateway Exposure': 'System exposed to internet',
    'Unrestricted Tool Execution': 'Uncontrolled system commands',
    'Unencrypted Session Storage': 'Unprotected conversation history',
    'Exposed Secrets in Configuration': 'Credentials stored insecurely',
    'No Rate Limiting': 'Missing protection against automated attacks',
    'Default Port Usage': 'Using standard network port',
    'Telegram Bot Token in Configuration': 'Communication credentials exposed',
    'No Telegram Chat ID Whitelist': 'Unrestricted system access'
  };
  
  return translations[technicalTitle] || technicalTitle.toLowerCase();
}

/**
 * Get emoji for severity level
 */
function getSeverityEmoji(severity) {
  const emojiMap = {
    CRITICAL: '🚨',
    HIGH: '⚠️',
    MEDIUM: '⚡',
    LOW: 'ℹ️'
  };
  return emojiMap[severity] || '•';
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format executive summary as markdown
 */
function formatExecutiveSummaryMarkdown(executiveSummary) {
  let markdown = `## Executive Summary\n\n`;
  markdown += `${executiveSummary.summary}\n\n`;
  
  markdown += `### Key Points\n\n`;
  executiveSummary.bullets.forEach(bullet => {
    markdown += `${bullet}\n\n`;
  });
  
  return markdown;
}

/**
 * Format executive summary as plain text (for email)
 */
function formatExecutiveSummaryPlainText(executiveSummary) {
  let text = `EXECUTIVE SUMMARY\n${'='.repeat(50)}\n\n`;
  text += `${executiveSummary.summary}\n\n`;
  
  text += `KEY POINTS:\n`;
  executiveSummary.bullets.forEach((bullet, i) => {
    // Strip markdown and emoji for plain text
    const plainBullet = bullet.replace(/[*_#]/g, '').replace(/[🚨⚠️⚡ℹ️✅🎯📊]/g, '');
    text += `${i + 1}. ${plainBullet}\n`;
  });
  
  return text;
}

/**
 * Generate executive summary for email/Slack
 * Ultra-concise version for notifications
 */
function generateExecutiveSummaryBrief(findings = [], scoreResult = {}) {
  const riskLevel = scoreResult.level || 'MEDIUM';
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  
  let brief = `Security Scan: ${findings.length} issues found (Risk: ${riskLevel}).\n`;
  
  if (criticalCount > 0) {
    brief += `⚠️ ${criticalCount} critical - immediate action required.`;
  } else if (highCount > 0) {
    brief += `⚠️ ${highCount} high-priority - address within 1 week.`;
  } else {
    brief += `No critical issues - review recommended.`;
  }
  
  return brief;
}

module.exports = {
  generateExecutiveSummary,
  formatExecutiveSummaryMarkdown,
  formatExecutiveSummaryPlainText,
  generateExecutiveSummaryBrief,
  BUSINESS_IMPACT_MAP,
  BUSINESS_RISK_LEVELS
};
