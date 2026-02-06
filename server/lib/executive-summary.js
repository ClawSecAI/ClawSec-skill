/**
 * ClawSec Executive Summary Generator (Technical Version)
 * Transforms detailed security findings into concise, technically precise summaries
 * 
 * @version 2.0.0 (Technical Revision)
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-06
 * @revised 2026-02-06 (Per Stan's feedback: technical version for technical audiences)
 * 
 * Purpose:
 * - Generate 3-5 precise bullet points for technical audience
 * - Use accurate threat terminology and identifiers
 * - Include technical details: threat IDs, CVE references, attack vectors
 * - Provide specific remediation paths and technical recommendations
 * 
 * Target Audience:
 * - Security engineers and analysts
 * - DevOps/SRE teams
 * - Technical team leads
 * - Security-conscious developers
 * 
 * Design Philosophy:
 * - Precision over simplification
 * - Technical accuracy over business language
 * - Detailed findings over high-level summaries
 * - Actionable remediation paths with technical specifics
 */

/**
 * Technical impact mapping for threat intelligence
 * Provides technical details, attack vectors, and remediation paths
 */
const TECHNICAL_THREAT_MAP = {
  'T001': { // Weak Gateway Token
    attack_vector: 'Token brute-force or entropy analysis',
    technical_impact: 'Complete Gateway API compromise, full system access',
    remediation: 'Generate cryptographically secure token (≥32 bytes, 256-bit entropy)',
    cve_references: [],
    owasp_category: 'A07:2021 – Identification and Authentication Failures'
  },
  'T002': { // Public Gateway Exposure
    attack_vector: 'Network scanning, direct internet access to Gateway API',
    technical_impact: 'Remote exploitation, unauthorized API access, DoS attacks',
    remediation: 'Bind Gateway to localhost (127.0.0.1) or internal network, implement firewall rules',
    cve_references: [],
    owasp_category: 'A01:2021 – Broken Access Control'
  },
  'T003': { // Unrestricted Tool Execution
    attack_vector: 'Arbitrary command injection via exec tool',
    technical_impact: 'Remote code execution (RCE), privilege escalation, lateral movement',
    remediation: 'Implement exec policy whitelist, restrict tool access, enable sandboxing',
    cve_references: [],
    owasp_category: 'A03:2021 – Injection'
  },
  'T004': { // Unencrypted Session Storage
    attack_vector: 'Filesystem access, memory dumps, backup extraction',
    technical_impact: 'Session hijacking, credential extraction, privacy violation (GDPR)',
    remediation: 'Enable session encryption (AES-256-GCM), implement secure key management',
    cve_references: [],
    owasp_category: 'A02:2021 – Cryptographic Failures'
  },
  'T005': { // Exposed Secrets
    attack_vector: 'Configuration file parsing, repository mining, .env exposure',
    technical_impact: 'API key compromise, credential theft, cloud resource hijacking',
    remediation: 'Migrate secrets to vault (HashiCorp Vault, AWS Secrets Manager), rotate exposed keys',
    cve_references: [],
    owasp_category: 'A02:2021 – Cryptographic Failures'
  },
  'T006': { // No Rate Limiting
    attack_vector: 'API abuse, brute-force attacks, resource exhaustion',
    technical_impact: 'Denial of Service (DoS), cost inflation, credential stuffing',
    remediation: 'Implement rate limiting middleware (express-rate-limit), token bucket algorithm',
    cve_references: [],
    owasp_category: 'A04:2021 – Insecure Design'
  },
  'T008': { // Default Port
    attack_vector: 'Network reconnaissance, automated scanning (Shodan, nmap)',
    technical_impact: 'Service fingerprinting, targeted exploitation, increased attack surface',
    remediation: 'Configure non-standard port (49152-65535), implement port knocking',
    cve_references: [],
    owasp_category: 'A05:2021 – Security Misconfiguration'
  },
  'T011': { // Telegram Bot Token
    attack_vector: 'Token extraction from configuration, API abuse',
    technical_impact: 'Bot impersonation, message interception, unauthorized command execution',
    remediation: 'Regenerate bot token via @BotFather, store in secure vault, implement IP whitelist',
    cve_references: [],
    owasp_category: 'A02:2021 – Cryptographic Failures'
  },
  'T012': { // No Chat Whitelist
    attack_vector: 'Unauthorized Telegram chat access, social engineering',
    technical_impact: 'Unrestricted API access, data exfiltration, resource abuse',
    remediation: 'Configure TELEGRAM_ALLOWED_CHAT_IDS, implement chat ID validation',
    cve_references: [],
    owasp_category: 'A01:2021 – Broken Access Control'
  }
};

/**
 * Risk level classifications with technical severity definitions
 */
const TECHNICAL_RISK_LEVELS = {
  CRITICAL: {
    label: 'CRITICAL',
    cvss_range: '9.0-10.0',
    description: 'Immediate exploitation possible, complete system compromise likely',
    sla: '< 24 hours',
    priority: 'P0'
  },
  HIGH: {
    label: 'HIGH',
    cvss_range: '7.0-8.9',
    description: 'Exploitable vulnerability, significant security impact',
    sla: '< 7 days',
    priority: 'P1'
  },
  MEDIUM: {
    label: 'MEDIUM',
    cvss_range: '4.0-6.9',
    description: 'Security weakness present, limited exploitability',
    sla: '< 30 days',
    priority: 'P2'
  },
  LOW: {
    label: 'LOW',
    cvss_range: '0.1-3.9',
    description: 'Minor security issue, low attack probability',
    sla: '< 90 days',
    priority: 'P3'
  },
  SECURE: {
    label: 'SECURE',
    cvss_range: '0.0',
    description: 'No exploitable vulnerabilities detected',
    sla: 'N/A',
    priority: 'N/A'
  }
};

/**
 * Generate technical executive summary from security findings
 * 
 * @param {Array} findings - Array of security findings
 * @param {Object} scoreResult - Risk score calculation result
 * @param {Object} options - Generation options
 * @returns {Object} Technical executive summary with precise details
 */
function generateExecutiveSummary(findings = [], scoreResult = {}, options = {}) {
  const {
    maxBullets = 5,
    includeRemediation = true,
    includeThreatIds = true,
    includeOwasp = true
  } = options;
  
  // Handle secure configuration (no findings)
  if (findings.length === 0) {
    return {
      summary: 'Security audit complete: No exploitable vulnerabilities detected. Configuration meets security best practices.',
      bullets: [
        '✅ Zero critical/high severity findings',
        '✅ Credential management verified secure',
        '✅ Network exposure validated (localhost-only)',
        '✅ Access controls implemented correctly',
        '📊 Recommendation: Maintain current posture, schedule quarterly re-audits'
      ],
      risk_level: 'SECURE',
      confidence: 'high',
      total_issues: 0,
      critical_issues: 0,
      high_issues: 0
    };
  }
  
  // Prioritize findings by severity and exploitability
  const prioritizedFindings = prioritizeFindings(findings);
  
  // Generate technical bullet points
  const bullets = generateTechnicalBullets(prioritizedFindings, scoreResult, {
    maxBullets,
    includeThreatIds,
    includeOwasp
  });
  
  // Generate technical summary statement
  const summaryStatement = generateTechnicalSummary(findings, scoreResult);
  
  // Add remediation recommendations if requested
  if (includeRemediation) {
    const remediation = generateRemediationSteps(prioritizedFindings, scoreResult);
    bullets.push(...remediation);
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
    high_issues: findings.filter(f => f.severity === 'HIGH').length,
    medium_issues: findings.filter(f => f.severity === 'MEDIUM').length,
    low_issues: findings.filter(f => f.severity === 'LOW').length
  };
}

/**
 * Prioritize findings by severity, exploitability, and technical impact
 */
function prioritizeFindings(findings) {
  // Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
  const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  
  return findings.sort((a, b) => {
    const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    
    // If same severity, prioritize by likelihood
    const likelihoodOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return (likelihoodOrder[b.likelihood] || 0) - (likelihoodOrder[a.likelihood] || 0);
  });
}

/**
 * Generate technical bullet points with threat IDs and precise details
 */
function generateTechnicalBullets(findings, scoreResult, options) {
  const bullets = [];
  const { maxBullets, includeThreatIds, includeOwasp } = options;
  
  // Reserve 1-2 bullets for remediation
  const findingBulletLimit = maxBullets - 1;
  
  findings.slice(0, findingBulletLimit).forEach(finding => {
    const threatData = TECHNICAL_THREAT_MAP[finding.threat_id] || {
      attack_vector: 'Unknown attack vector',
      technical_impact: finding.impact || 'Security vulnerability detected',
      remediation: 'Review configuration and apply security hardening',
      owasp_category: 'Unknown'
    };
    
    // Build technical bullet with threat ID, severity, and attack vector
    const emoji = getSeverityEmoji(finding.severity);
    let bullet = `${emoji} **[${finding.threat_id}] ${finding.title}** (${finding.severity})`;
    
    if (includeThreatIds) {
      bullet += ` — ${threatData.attack_vector}`;
    }
    
    // Add technical impact
    bullet += `. Impact: ${threatData.technical_impact}`;
    
    // Add evidence if available
    if (finding.evidence && Object.keys(finding.evidence).length > 0) {
      const evidenceSummary = formatEvidence(finding.evidence);
      if (evidenceSummary) {
        bullet += ` (Evidence: ${evidenceSummary})`;
      }
    }
    
    bullets.push(bullet);
  });
  
  return bullets;
}

/**
 * Format evidence for technical display
 */
function formatEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return '';
  
  const items = [];
  for (const [key, value] of Object.entries(evidence)) {
    if (value !== null && value !== undefined) {
      items.push(`${key}=${JSON.stringify(value)}`);
    }
  }
  
  return items.slice(0, 3).join(', '); // Limit to 3 evidence items
}

/**
 * Generate technical summary statement with precise metrics
 */
function generateTechnicalSummary(findings, scoreResult) {
  const riskLevel = scoreResult.level || 'MEDIUM';
  const score = scoreResult.score || 50;
  const techRisk = TECHNICAL_RISK_LEVELS[riskLevel] || TECHNICAL_RISK_LEVELS.MEDIUM;
  
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.severity === 'LOW').length;
  
  // Build technical summary with precise counts
  let summary = `Security audit identified ${findings.length} finding${findings.length === 1 ? '' : 's'}: `;
  
  const breakdowns = [];
  if (criticalCount > 0) breakdowns.push(`${criticalCount} CRITICAL`);
  if (highCount > 0) breakdowns.push(`${highCount} HIGH`);
  if (mediumCount > 0) breakdowns.push(`${mediumCount} MEDIUM`);
  if (lowCount > 0) breakdowns.push(`${lowCount} LOW`);
  
  summary += breakdowns.join(', ') + '. ';
  
  // Add risk score and CVSS range
  summary += `Risk Score: **${score}/100** (${techRisk.label}, CVSS ${techRisk.cvss_range}). `;
  
  // Add SLA and priority
  summary += `Remediation SLA: ${techRisk.sla} (${techRisk.priority} priority). `;
  
  // Add exploitability assessment
  if (criticalCount > 0 || highCount > 0) {
    summary += 'Immediate action required to prevent exploitation.';
  } else {
    summary += 'No immediately exploitable vulnerabilities detected.';
  }
  
  return summary;
}

/**
 * Generate technical remediation steps with specific implementation details
 */
function generateRemediationSteps(findings, scoreResult) {
  const recommendations = [];
  const riskLevel = scoreResult.level || 'MEDIUM';
  const techRisk = TECHNICAL_RISK_LEVELS[riskLevel] || TECHNICAL_RISK_LEVELS.MEDIUM;
  
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  
  // Generate specific remediation for highest severity finding
  const topFinding = findings[0];
  if (topFinding) {
    const threatData = TECHNICAL_THREAT_MAP[topFinding.threat_id];
    if (threatData) {
      recommendations.push(
        `🔧 **Remediation Priority ${techRisk.priority}**: ${threatData.remediation}`
      );
    }
  }
  
  // Add overall remediation guidance
  if (criticalCount > 0) {
    recommendations.push(
      `⚠️ **Urgent**: Patch ${criticalCount} critical vulnerabilit${criticalCount === 1 ? 'y' : 'ies'} within ${techRisk.sla}. Isolate affected systems if exploitation suspected.`
    );
  } else if (highCount > 0) {
    recommendations.push(
      `📊 **Action Required**: Address ${highCount} high-severity finding${highCount === 1 ? '' : 's'} within ${techRisk.sla}. Implement monitoring for exploitation attempts.`
    );
  }
  
  return recommendations;
}

/**
 * Get emoji indicator for severity level
 */
function getSeverityEmoji(severity) {
  const emojiMap = {
    CRITICAL: '🔴',
    HIGH: '🟠',
    MEDIUM: '🟡',
    LOW: '🔵'
  };
  return emojiMap[severity] || '⚪';
}

/**
 * Format executive summary as markdown with technical formatting
 */
function formatExecutiveSummaryMarkdown(executiveSummary) {
  let markdown = `## Executive Summary (Technical)\n\n`;
  markdown += `${executiveSummary.summary}\n\n`;
  
  markdown += `### Security Findings\n\n`;
  executiveSummary.bullets.forEach(bullet => {
    markdown += `${bullet}\n\n`;
  });
  
  // Add severity distribution table
  if (executiveSummary.total_issues > 0) {
    markdown += `### Severity Distribution\n\n`;
    markdown += `| Severity | Count |\n`;
    markdown += `|----------|-------|\n`;
    markdown += `| 🔴 CRITICAL | ${executiveSummary.critical_issues || 0} |\n`;
    markdown += `| 🟠 HIGH | ${executiveSummary.high_issues || 0} |\n`;
    markdown += `| 🟡 MEDIUM | ${executiveSummary.medium_issues || 0} |\n`;
    markdown += `| 🔵 LOW | ${executiveSummary.low_issues || 0} |\n`;
    markdown += `| **Total** | **${executiveSummary.total_issues}** |\n\n`;
  }
  
  return markdown;
}

/**
 * Format executive summary as plain text for logs/email
 */
function formatExecutiveSummaryPlainText(executiveSummary) {
  let text = `SECURITY AUDIT SUMMARY (TECHNICAL)\n${'='.repeat(60)}\n\n`;
  text += `${executiveSummary.summary}\n\n`;
  
  text += `SECURITY FINDINGS:\n`;
  executiveSummary.bullets.forEach((bullet, i) => {
    // Strip markdown and emoji for plain text, keep technical details
    const plainBullet = bullet
      .replace(/\*\*/g, '')
      .replace(/[🔴🟠🟡🔵⚪🔧⚠️📊✅]/g, '')
      .trim();
    text += `${i + 1}. ${plainBullet}\n`;
  });
  
  // Add severity distribution
  if (executiveSummary.total_issues > 0) {
    text += `\nSEVERITY DISTRIBUTION:\n`;
    text += `  CRITICAL: ${executiveSummary.critical_issues || 0}\n`;
    text += `  HIGH:     ${executiveSummary.high_issues || 0}\n`;
    text += `  MEDIUM:   ${executiveSummary.medium_issues || 0}\n`;
    text += `  LOW:      ${executiveSummary.low_issues || 0}\n`;
    text += `  -------------------------\n`;
    text += `  TOTAL:    ${executiveSummary.total_issues}\n`;
  }
  
  return text;
}

/**
 * Generate brief technical summary for notifications
 */
function generateExecutiveSummaryBrief(findings = [], scoreResult = {}) {
  const riskLevel = scoreResult.level || 'MEDIUM';
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const techRisk = TECHNICAL_RISK_LEVELS[riskLevel] || TECHNICAL_RISK_LEVELS.MEDIUM;
  
  let brief = `Security Audit: ${findings.length} findings (Risk: ${riskLevel}, CVSS ${techRisk.cvss_range}).\n`;
  
  if (criticalCount > 0) {
    brief += `🔴 ${criticalCount} CRITICAL - patch within ${techRisk.sla}.`;
  } else if (highCount > 0) {
    brief += `🟠 ${highCount} HIGH - remediate within ${techRisk.sla}.`;
  } else {
    brief += `No critical/high findings. Review recommended.`;
  }
  
  return brief;
}

module.exports = {
  generateExecutiveSummary,
  formatExecutiveSummaryMarkdown,
  formatExecutiveSummaryPlainText,
  generateExecutiveSummaryBrief,
  TECHNICAL_THREAT_MAP,
  TECHNICAL_RISK_LEVELS
};
