/**
 * ClawSec JSON Export Module
 * 
 * Generates machine-readable JSON reports for downstream processing,
 * integrations, and automated remediation pipelines.
 * 
 * @version 1.0.0
 * @license MIT
 */

/**
 * Generate a complete JSON report from scan findings
 * 
 * @param {string} scanId - Unique scan identifier
 * @param {Object} scanInput - Original scan input configuration
 * @param {Array} findings - Array of security findings
 * @param {Object} threatsIndex - Threat database index
 * @param {Object} scoreResult - Risk score calculation result
 * @param {Object} prioritized - Prioritized recommendations
 * @param {Object} optimization - Token optimization statistics
 * @returns {Object} Complete JSON report
 */
function generateJSONReport(scanId, scanInput, findings, threatsIndex, scoreResult, prioritized, optimization) {
  const timestamp = new Date().toISOString();
  
  // Build severity distribution
  const severityCounts = {
    critical: findings.filter(f => f.severity === 'CRITICAL').length,
    high: findings.filter(f => f.severity === 'HIGH').length,
    medium: findings.filter(f => f.severity === 'MEDIUM').length,
    low: findings.filter(f => f.severity === 'LOW').length
  };
  
  // Extract key findings (top 3 by severity)
  const keyFindings = findings
    .sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 3)
    .map(f => f.title);
  
  // Extract immediate actions (CRITICAL and HIGH findings)
  const immediateActions = findings
    .filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')
    .slice(0, 3)
    .map(f => ({
      threat_id: f.threat_id,
      title: f.title,
      action: f.remediation?.immediate?.[0] || 'Review and address this finding immediately'
    }));
  
  // Build the complete JSON report structure
  const report = {
    // Report Metadata
    metadata: {
      scan_id: scanId,
      timestamp: timestamp,
      report_version: '1.0.0',
      clawsec_version: '0.1.0-hackathon',
      format: 'json',
      generator: 'ClawSec JSON Export Module'
    },
    
    // Executive Summary
    summary: {
      total_findings: findings.length,
      risk_level: scoreResult.level,
      risk_score: scoreResult.score,
      score_confidence: scoreResult.confidence,
      severity_distribution: severityCounts,
      key_findings: keyFindings,
      immediate_actions_required: immediateActions.length
    },
    
    // Detailed Findings
    findings: findings.map(finding => ({
      threat_id: finding.threat_id,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      impact: finding.impact,
      likelihood: finding.likelihood,
      evidence: finding.evidence || {},
      remediation: {
        immediate: finding.remediation?.immediate || [],
        short_term: finding.remediation?.short_term || [],
        long_term: finding.remediation?.long_term || []
      },
      // Add priority information if available
      priority: finding.priority ? {
        level: finding.priority.level,
        score: finding.priority.score,
        time_to_fix: finding.priority.timeToFix,
        reasoning: finding.priority.reasoning
      } : null
    })),
    
    // Prioritized Recommendations (if available)
    recommendations: prioritized ? {
      summary: prioritized.summary,
      immediate_actions: immediateActions,
      priority_distribution: {
        p0_critical: prioritized.rankings.filter(r => r.priority.level === 'P0').length,
        p1_high: prioritized.rankings.filter(r => r.priority.level === 'P1').length,
        p2_medium: prioritized.rankings.filter(r => r.priority.level === 'P2').length,
        p3_low: prioritized.rankings.filter(r => r.priority.level === 'P3').length
      },
      rankings: prioritized.rankings.map(r => ({
        threat_id: r.threat_id,
        title: r.title,
        severity: r.severity,
        priority_level: r.priority.level,
        priority_score: r.priority.score,
        time_to_fix: {
          duration: r.priority.timeToFix.duration,
          unit: r.priority.timeToFix.unit,
          deadline: r.priority.timeToFix.deadline
        },
        reasoning: r.priority.reasoning,
        exploitability: r.priority.components.exploitability,
        impact: r.priority.components.impact
      }))
    } : null,
    
    // Risk Analysis
    risk_analysis: {
      overall_score: scoreResult.score,
      risk_level: scoreResult.level,
      confidence: scoreResult.confidence,
      score_breakdown: scoreResult.breakdown || {},
      risk_factors: extractRiskFactors(findings),
      compliance_impact: {
        owasp_llm_top10: checkOWASPCompliance(findings),
        gdpr_considerations: checkGDPRConsiderations(findings)
      }
    },
    
    // Context Optimization Stats (useful for cost tracking)
    optimization: optimization ? {
      model: optimization.model,
      scan_tokens: optimization.scan_tokens,
      context_tokens: optimization.context_tokens,
      total_tokens: optimization.total_tokens,
      categories_loaded: optimization.categories_loaded,
      categories_skipped: optimization.categories_skipped,
      budget_used_percent: optimization.budget_used_percent
    } : null,
    
    // Scan Context (for reference and auditability)
    scan_context: {
      configuration_analyzed: Object.keys(scanInput),
      scan_type: 'configuration_audit',
      threat_database_version: threatsIndex?.version || 'unknown'
    },
    
    // Next Steps (actionable checklist)
    next_steps: {
      immediate: [
        'Review and address all CRITICAL severity findings immediately',
        'Backup current configuration before making changes',
        'Rotate any exposed credentials found in this scan'
      ],
      short_term: [
        'Address all HIGH severity findings within 48 hours',
        'Implement monitoring for security events',
        'Review and update access controls'
      ],
      long_term: [
        'Schedule regular security scans (weekly recommended)',
        'Implement automated security testing in CI/CD',
        'Conduct security training for team members'
      ]
    }
  };
  
  return report;
}

/**
 * Extract risk factors from findings for risk analysis
 */
function extractRiskFactors(findings) {
  const factors = [];
  
  // Check for credential exposure
  const credentialFindings = findings.filter(f => 
    f.threat_id === 'T005' || 
    f.title.toLowerCase().includes('credential') ||
    f.title.toLowerCase().includes('secret') ||
    f.title.toLowerCase().includes('token')
  );
  
  if (credentialFindings.length > 0) {
    factors.push({
      factor: 'credential_exposure',
      severity: 'CRITICAL',
      description: 'Exposed credentials found in configuration',
      count: credentialFindings.length
    });
  }
  
  // Check for public exposure
  const exposureFindings = findings.filter(f => 
    f.threat_id === 'T002' ||
    f.title.toLowerCase().includes('public') ||
    f.title.toLowerCase().includes('exposure')
  );
  
  if (exposureFindings.length > 0) {
    factors.push({
      factor: 'public_exposure',
      severity: 'HIGH',
      description: 'Services exposed to public network',
      count: exposureFindings.length
    });
  }
  
  // Check for weak authentication
  const authFindings = findings.filter(f => 
    f.threat_id === 'T001' ||
    f.title.toLowerCase().includes('weak') ||
    f.title.toLowerCase().includes('authentication')
  );
  
  if (authFindings.length > 0) {
    factors.push({
      factor: 'weak_authentication',
      severity: 'CRITICAL',
      description: 'Weak authentication mechanisms detected',
      count: authFindings.length
    });
  }
  
  // Check for unrestricted access
  const accessFindings = findings.filter(f => 
    f.threat_id === 'T003' ||
    f.title.toLowerCase().includes('unrestricted')
  );
  
  if (accessFindings.length > 0) {
    factors.push({
      factor: 'unrestricted_access',
      severity: 'HIGH',
      description: 'Unrestricted access controls',
      count: accessFindings.length
    });
  }
  
  return factors;
}

/**
 * Check OWASP LLM Top 10 compliance
 */
function checkOWASPCompliance(findings) {
  const owaspCategories = {
    'LLM01_prompt_injection': findings.filter(f => 
      f.description?.toLowerCase().includes('prompt injection') ||
      f.description?.toLowerCase().includes('instruction override')
    ).length,
    'LLM06_sensitive_info_disclosure': findings.filter(f => 
      f.threat_id === 'T005' || 
      f.threat_id === 'T004' ||
      f.title.toLowerCase().includes('secret') ||
      f.title.toLowerCase().includes('credential')
    ).length,
    'LLM07_insecure_plugin_design': findings.filter(f => 
      f.threat_id === 'T003' ||
      f.title.toLowerCase().includes('tool') ||
      f.title.toLowerCase().includes('exec')
    ).length,
    'LLM08_excessive_agency': findings.filter(f => 
      f.title.toLowerCase().includes('permission') ||
      f.title.toLowerCase().includes('unrestricted')
    ).length
  };
  
  return {
    categories_affected: Object.entries(owaspCategories)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        category: category.replace(/_/g, ' ').toUpperCase(),
        findings_count: count
      })),
    total_owasp_findings: Object.values(owaspCategories).reduce((a, b) => a + b, 0)
  };
}

/**
 * Check GDPR compliance considerations
 */
function checkGDPRConsiderations(findings) {
  const gdprIssues = [];
  
  // Check for unencrypted data storage
  const encryptionFindings = findings.filter(f => 
    f.threat_id === 'T004' ||
    f.title.toLowerCase().includes('unencrypted') ||
    f.title.toLowerCase().includes('encryption')
  );
  
  if (encryptionFindings.length > 0) {
    gdprIssues.push({
      article: 'Article 32 - Security of Processing',
      issue: 'Unencrypted data storage detected',
      severity: 'HIGH',
      description: 'GDPR requires appropriate technical measures to secure personal data'
    });
  }
  
  // Check for exposed secrets (data breach risk)
  const secretFindings = findings.filter(f => f.threat_id === 'T005');
  
  if (secretFindings.length > 0) {
    gdprIssues.push({
      article: 'Article 33 - Breach Notification',
      issue: 'Exposed credentials increase breach risk',
      severity: 'CRITICAL',
      description: 'Credential exposure could lead to data breach requiring 72-hour notification'
    });
  }
  
  return {
    issues_found: gdprIssues.length,
    compliance_concerns: gdprIssues,
    recommendation: gdprIssues.length > 0 ? 
      'Address identified issues to maintain GDPR compliance' : 
      'No immediate GDPR compliance concerns identified'
  };
}

/**
 * Export JSON report as formatted string
 * 
 * @param {Object} report - JSON report object
 * @param {boolean} pretty - Whether to pretty-print the JSON
 * @returns {string} JSON string
 */
function exportJSON(report, pretty = true) {
  return JSON.stringify(report, null, pretty ? 2 : 0);
}

module.exports = {
  generateJSONReport,
  exportJSON,
  extractRiskFactors,
  checkOWASPCompliance,
  checkGDPRConsiderations
};
