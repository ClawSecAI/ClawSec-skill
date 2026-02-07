/**
 * OWASP LLM Top 10 Mapper
 * Maps ClawSec threats to OWASP LLM Application Security categories
 * 
 * @version 1.0.0
 * @author Ubik (@ClawSecAI)
 * @updated 2026-02-07
 */

/**
 * OWASP LLM Top 10 (2025) Category Definitions
 * Official 2025 update with reordered priorities and new categories
 * Reference: https://genai.owasp.org/llm-top-10/
 */
const OWASP_CATEGORIES = {
  LLM01: {
    id: 'LLM01',
    name: 'Prompt Injection',
    description: 'Manipulating LLM inputs to override instructions, extract data, or trigger harmful actions',
    severity_weight: 1.0,
    compliance_priority: 1
  },
  LLM02: {
    id: 'LLM02',
    name: 'Sensitive Information Disclosure',
    description: 'Exposing private, regulated, or confidential information through LLM outputs or configurations',
    severity_weight: 1.0,
    compliance_priority: 2
  },
  LLM03: {
    id: 'LLM03',
    name: 'Supply Chain',
    description: 'Risks in third-party, open-source, or upstream LLM components and services',
    severity_weight: 0.9,
    compliance_priority: 3
  },
  LLM04: {
    id: 'LLM04',
    name: 'Data and Model Poisoning',
    description: 'Malicious or manipulated data corrupting training or fine-tuning processes',
    severity_weight: 0.85,
    compliance_priority: 4
  },
  LLM05: {
    id: 'LLM05',
    name: 'Improper Output Handling',
    description: 'Passing untrusted LLM outputs directly to downstream systems without validation',
    severity_weight: 0.9,
    compliance_priority: 5
  },
  LLM06: {
    id: 'LLM06',
    name: 'Excessive Agency',
    description: 'Granting LLMs too much control over sensitive actions or tools',
    severity_weight: 0.85,
    compliance_priority: 6
  },
  LLM07: {
    id: 'LLM07',
    name: 'System Prompt Leakage',
    description: 'Exposure of hidden instructions or system prompts through adversarial queries',
    severity_weight: 0.8,
    compliance_priority: 7
  },
  LLM08: {
    id: 'LLM08',
    name: 'Vector and Embedding Weaknesses',
    description: 'Exploiting weaknesses in embeddings or vector databases (RAG systems)',
    severity_weight: 0.75,
    compliance_priority: 8
  },
  LLM09: {
    id: 'LLM09',
    name: 'Misinformation',
    description: 'Generation or amplification of false or misleading content',
    severity_weight: 0.7,
    compliance_priority: 9
  },
  LLM10: {
    id: 'LLM10',
    name: 'Unbounded Consumption',
    description: 'Resource exhaustion or uncontrolled cost growth from LLM use',
    severity_weight: 0.8,
    compliance_priority: 10
  }
};

/**
 * Threat ID to OWASP Category Mapping (2025 Edition)
 * Maps ClawSec threat identifiers to OWASP LLM Top 10 (2025) categories
 */
const THREAT_TO_OWASP_MAP = {
  // LLM01: Prompt Injection
  'T001': ['LLM01'], // Weak Gateway Authentication → enables prompt injection
  'T002': ['LLM01', 'LLM06'], // Tool Permission Misconfiguration → prompt-driven privilege escalation + excessive agency
  'T003': ['LLM01', 'LLM02'], // Session Log Credential Leakage → reveals patterns + exposes secrets
  'T015': ['LLM01'], // No Input Sanitization → classic prompt injection
  
  // LLM02: Sensitive Information Disclosure
  'T003': ['LLM01', 'LLM02'], // Session Log Credential Leakage
  'T006': ['LLM02'], // Hardcoded API Keys
  'T007': ['LLM02'], // Database Connection String Exposure
  'T008': ['LLM02'], // Private Key in Repository
  'T019': ['LLM02'], // PII in Memory Files
  'T021': ['LLM02'], // API Keys in Error Messages
  
  // LLM03: Supply Chain
  'T010': ['LLM03', 'LLM04'], // Unsafe Skill Installation Sources → supply chain + poisoning
  'T011': ['LLM03'], // Outdated Dependencies with CVEs
  'T018': ['LLM03'], // Unverified LLM Provider Endpoints
  'T030': ['LLM03'], // Missing Package Signature Verification
  
  // LLM04: Data and Model Poisoning
  'T009': ['LLM04'], // Insecure Memory File Permissions → can inject poisoned context
  'T010': ['LLM03', 'LLM04'], // Unsafe Skill Installation Sources
  'T025': ['LLM04', 'LLM07'], // User-Controlled System Prompts → poisoning + prompt leakage
  
  // LLM05: Improper Output Handling
  'T004': ['LLM05'], // Unencrypted Telegram Bot Token → LLM output sent unsafely
  'T005': ['LLM05'], // Exposed Discord Webhook → LLM output not validated
  'T012': ['LLM05', 'LLM10'], // Missing Rate Limiting → output flooding + resource exhaustion
  'T020': ['LLM05'], // XSS in Web Channel Outputs → improper output handling
  
  // LLM06: Excessive Agency
  'T002': ['LLM01', 'LLM06'], // Tool Permission Misconfiguration
  'T024': ['LLM06'], // No Human-in-the-Loop Controls
  'T026': ['LLM06'], // Autonomous Financial Transactions
  'T027': ['LLM06'], // Broad File System Access
  
  // LLM07: System Prompt Leakage
  'T025': ['LLM04', 'LLM07'], // User-Controlled System Prompts → can leak via manipulation
  'T034': ['LLM07'], // Debug Mode Exposing System Prompts (new threat)
  
  // LLM08: Vector and Embedding Weaknesses
  'T035': ['LLM08'], // Malicious RAG Document Injection (new threat)
  'T036': ['LLM08'], // Vector Database Poisoning (new threat)
  
  // LLM09: Misinformation
  'T028': ['LLM09'], // Automated Deployment Without Review → misinformation in code
  'T029': ['LLM09'], // LLM-Generated Security Policies → potential misinformation
  'T031': ['LLM09'], // Medical/Legal Advice from LLM → misinformation risk
  'T037': ['LLM09'], // No Fact-Checking for LLM Outputs (new threat)
  
  // LLM10: Unbounded Consumption
  'T012': ['LLM05', 'LLM10'], // Missing Rate Limiting
  'T014': ['LLM10'], // No Request Size Limits
  'T016': ['LLM10'], // Recursive Tool Call Loops
  'T022': ['LLM10'], // Missing Circuit Breakers
  'T032': ['LLM10'], // No Token Budget Controls
  'T033': ['LLM10'], // Uncapped Tool Execution Loops
  
  // LLM07: Insecure Plugin Design (legacy mappings for backward compatibility)
  'T013': ['LLM06'], // Missing Tool Input Validation → now mapped to Excessive Agency
  'T017': ['LLM06'], // Tool Authentication Bypass → excessive agency
  'T023': ['LLM06']  // Missing Tool Execution Logging → excessive agency
};

/**
 * Pattern-based threat detection to OWASP mapping (2025 Edition)
 * Maps credential patterns to OWASP categories
 * Note: LLM02 in 2025 is "Sensitive Information Disclosure" (moved from LLM06 in 2023)
 */
const PATTERN_TO_OWASP_MAP = {
  // API Keys and credentials → Sensitive Information Disclosure (LLM02 in 2025)
  'aws': ['LLM02'],
  'google': ['LLM02'],
  'azure': ['LLM02'],
  'openai': ['LLM02'],
  'anthropic': ['LLM02'],
  'github': ['LLM02'],
  'slack': ['LLM02'],
  'telegram': ['LLM02', 'LLM05'], // Sensitive info disclosure + improper output if bot token
  'discord': ['LLM02', 'LLM05'], // Sensitive info disclosure + improper output if webhook
  'database': ['LLM02'],
  'jwt': ['LLM02'],
  'private_key': ['LLM02'],
  'ssh': ['LLM02'],
  'credit_card': ['LLM02'],
  'ssn': ['LLM02']
};

/**
 * Map a single threat to OWASP categories
 * @param {string} threatId - Threat identifier (e.g., 'T001')
 * @returns {string[]} Array of OWASP category IDs
 */
function mapThreatToOWASP(threatId) {
  return THREAT_TO_OWASP_MAP[threatId] || [];
}

/**
 * Map credential pattern type to OWASP categories
 * @param {string} patternName - Credential pattern name (e.g., 'AWS Access Key')
 * @returns {string[]} Array of OWASP category IDs
 */
function mapPatternToOWASP(patternName) {
  const lowerName = patternName.toLowerCase();
  
  for (const [key, categories] of Object.entries(PATTERN_TO_OWASP_MAP)) {
    if (lowerName.includes(key)) {
      return categories;
    }
  }
  
  // Default to LLM06 (Sensitive Information Disclosure) for any credential
  return ['LLM06'];
}

/**
 * Generate OWASP compliance summary from findings
 * @param {Array} findings - Array of finding objects with severity and optional threat_id
 * @returns {Object} OWASP compliance summary
 */
function generateOWASPCompliance(findings) {
  const categoryCounts = {};
  const categoryFindings = {};
  const categorySeverities = {};
  
  // Initialize all categories
  Object.keys(OWASP_CATEGORIES).forEach(catId => {
    categoryCounts[catId] = 0;
    categoryFindings[catId] = [];
    categorySeverities[catId] = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
  });
  
  // Process each finding
  findings.forEach(finding => {
    let owaspCategories = [];
    
    // Try to map by threat ID first
    if (finding.threat_id) {
      owaspCategories = mapThreatToOWASP(finding.threat_id);
    }
    
    // If no threat ID, try pattern-based mapping
    if (owaspCategories.length === 0 && finding.type) {
      owaspCategories = mapPatternToOWASP(finding.type);
    }
    
    // If still no mapping, default to LLM02 for credentials (Sensitive Information Disclosure in 2025)
    if (owaspCategories.length === 0) {
      owaspCategories = ['LLM02'];
    }
    
    // Count findings per category
    owaspCategories.forEach(catId => {
      categoryCounts[catId]++;
      categoryFindings[catId].push(finding);
      
      const severity = (finding.severity || 'MEDIUM').toLowerCase();
      if (categorySeverities[catId][severity] !== undefined) {
        categorySeverities[catId][severity]++;
      }
    });
  });
  
  // Generate category summaries
  const categories = Object.keys(OWASP_CATEGORIES).map(catId => {
    const count = categoryCounts[catId];
    const severities = categorySeverities[catId];
    const totalSeverity = severities.critical + severities.high + severities.medium + severities.low;
    
    let status = 'compliant';
    let statusEmoji = '✅';
    
    if (severities.critical > 0) {
      status = 'critical_issues';
      statusEmoji = '🚨';
    } else if (severities.high > 0 || severities.medium > 0) {
      status = 'issues_found';
      statusEmoji = '⚠️';
    } else if (severities.low > 0) {
      status = 'minor_issues';
      statusEmoji = 'ℹ️';
    }
    
    return {
      id: catId,
      name: OWASP_CATEGORIES[catId].name,
      description: OWASP_CATEGORIES[catId].description,
      status,
      status_emoji: statusEmoji,
      findings_count: count,
      severity_breakdown: severities,
      findings: categoryFindings[catId].map(f => ({
        type: f.type || f.title,
        severity: f.severity,
        file: f.file,
        line: f.line
      }))
    };
  });
  
  // Calculate overall compliance
  const compliantCategories = categories.filter(c => c.status === 'compliant').length;
  const totalCategories = Object.keys(OWASP_CATEGORIES).length;
  const compliancePercentage = (compliantCategories / totalCategories);
  
  // Determine overall risk level
  const totalCritical = Object.values(categorySeverities).reduce((sum, s) => sum + s.critical, 0);
  const totalHigh = Object.values(categorySeverities).reduce((sum, s) => sum + s.high, 0);
  
  let overallRisk = 'LOW';
  let overallRiskEmoji = '✅';
  
  if (totalCritical > 0) {
    overallRisk = 'CRITICAL';
    overallRiskEmoji = '🚨';
  } else if (totalHigh > 0) {
    overallRisk = 'HIGH';
    overallRiskEmoji = '🟠';
  } else if (compliantCategories < totalCategories) {
    overallRisk = 'MEDIUM';
    overallRiskEmoji = '⚠️';
  }
  
  return {
    version: '2025',
    categories: categories.sort((a, b) => {
      // Sort by priority (critical first, then by OWASP category priority)
      const aPriority = a.severity_breakdown.critical > 0 ? 0 : OWASP_CATEGORIES[a.id].compliance_priority;
      const bPriority = b.severity_breakdown.critical > 0 ? 0 : OWASP_CATEGORIES[b.id].compliance_priority;
      return aPriority - bPriority;
    }),
    overall_compliance: compliancePercentage,
    compliant_categories: compliantCategories,
    total_categories: totalCategories,
    overall_risk: overallRisk,
    overall_risk_emoji: overallRiskEmoji,
    total_findings: findings.length,
    critical_findings: totalCritical,
    high_findings: totalHigh
  };
}

/**
 * Generate OWASP compliance checklist markdown
 * @param {Object} owaspCompliance - OWASP compliance object from generateOWASPCompliance
 * @returns {string} Markdown formatted compliance checklist
 */
function generateOWASPChecklistMarkdown(owaspCompliance) {
  const { categories, overall_compliance, compliant_categories, total_categories, overall_risk, overall_risk_emoji } = owaspCompliance;
  
  let markdown = '## 🔒 OWASP LLM Top 10 Compliance\n\n';
  markdown += '**Standard:** OWASP Top 10 for Large Language Model Applications (2025)  \n';
  markdown += `**Overall Compliance:** ${(overall_compliance * 100).toFixed(0)}% (${compliant_categories}/${total_categories} categories)  \n`;
  markdown += `**Compliance Risk Level:** ${overall_risk_emoji} **${overall_risk}**\n\n`;
  
  markdown += '| Category | Status | Findings | Critical | High | Medium | Low |\n';
  markdown += '|----------|--------|----------|----------|------|--------|-----|\n';
  
  categories.forEach(cat => {
    const { id, name, status_emoji, findings_count, severity_breakdown } = cat;
    markdown += `| ${id}: ${name} | ${status_emoji} ${formatStatus(cat.status)} | ${findings_count} | ${severity_breakdown.critical} | ${severity_breakdown.high} | ${severity_breakdown.medium} | ${severity_breakdown.low} |\n`;
  });
  
  markdown += '\n### Compliance Status Legend\n\n';
  markdown += '- ✅ **Compliant**: No findings detected for this category\n';
  markdown += '- ℹ️ **Minor Issues**: Low-severity findings only\n';
  markdown += '- ⚠️ **Issues Found**: Medium or high severity findings present\n';
  markdown += '- 🚨 **Critical Issues**: Critical severity findings require immediate attention\n\n';
  
  // Add critical category details
  const criticalCategories = categories.filter(c => c.severity_breakdown.critical > 0);
  if (criticalCategories.length > 0) {
    markdown += '### 🚨 Critical OWASP Categories Requiring Immediate Action\n\n';
    criticalCategories.forEach(cat => {
      markdown += `#### ${cat.id}: ${cat.name}\n\n`;
      markdown += `**Critical Findings:** ${cat.severity_breakdown.critical}  \n`;
      markdown += `**Description:** ${cat.description}\n\n`;
      
      // List top 3 critical findings
      const criticalFindings = cat.findings.filter(f => f.severity === 'CRITICAL').slice(0, 3);
      if (criticalFindings.length > 0) {
        markdown += '**Examples:**\n';
        criticalFindings.forEach(f => {
          markdown += `- ${f.type} (${f.file})\n`;
        });
        markdown += '\n';
      }
    });
  }
  
  markdown += '### 📚 Reference\n\n';
  markdown += 'For detailed threat-to-OWASP mappings, see:\n';
  markdown += '- [ClawSec OWASP Mapping Reference](../docs/owasp-llm-top-10-mapping.md)\n';
  markdown += '- [OWASP LLM Top 10 Official Documentation](https://genai.owasp.org/llm-top-10/)\n\n';
  
  return markdown;
}

/**
 * Format compliance status for display
 * @param {string} status - Status code
 * @returns {string} Human-readable status
 */
function formatStatus(status) {
  const statusMap = {
    'compliant': 'Compliant',
    'minor_issues': 'Minor Issues',
    'issues_found': 'Issues Found',
    'critical_issues': 'Critical Issues'
  };
  return statusMap[status] || status;
}

/**
 * Get OWASP category details by ID
 * @param {string} categoryId - OWASP category ID (e.g., 'LLM01')
 * @returns {Object|null} Category details or null if not found
 */
function getOWASPCategory(categoryId) {
  return OWASP_CATEGORIES[categoryId] || null;
}

/**
 * Get all threat IDs mapped to a specific OWASP category
 * @param {string} categoryId - OWASP category ID
 * @returns {string[]} Array of threat IDs
 */
function getThreatsForCategory(categoryId) {
  const threats = [];
  Object.entries(THREAT_TO_OWASP_MAP).forEach(([threatId, categories]) => {
    if (categories.includes(categoryId)) {
      threats.push(threatId);
    }
  });
  return threats;
}

module.exports = {
  OWASP_CATEGORIES,
  THREAT_TO_OWASP_MAP,
  PATTERN_TO_OWASP_MAP,
  mapThreatToOWASP,
  mapPatternToOWASP,
  generateOWASPCompliance,
  generateOWASPChecklistMarkdown,
  getOWASPCategory,
  getThreatsForCategory
};
