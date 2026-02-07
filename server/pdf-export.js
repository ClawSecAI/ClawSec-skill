/**
 * ClawSec PDF Export Module
 * 
 * Generates professional PDF reports from ClawSec security audit results.
 * Uses Puppeteer to render HTML-to-PDF with custom styling.
 * 
 * @version 1.0.0
 * @license MIT
 */

const puppeteer = require('puppeteer');
const { generateJSONReport } = require('./json-export');

/**
 * Generate a styled HTML report from JSON data
 * 
 * @param {Object} jsonReport - Complete JSON report from generateJSONReport()
 * @returns {string} Styled HTML document
 */
function generateHTMLReport(jsonReport) {
  const { metadata, summary, findings, recommendations, risk_analysis, scan_context } = jsonReport;
  
  // Build HTML with professional styling
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ClawSec Security Audit Report - ${metadata.scan_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
      padding: 40px 50px;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    h1 {
      font-size: 28pt;
      color: #1e3a8a;
      margin-bottom: 15px;
      font-weight: 700;
    }
    
    .metadata {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      font-size: 10pt;
      color: #6b7280;
      margin-top: 15px;
    }
    
    .metadata-item {
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #374151;
    }
    
    h2 {
      font-size: 18pt;
      color: #1e3a8a;
      margin-top: 30px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    h3 {
      font-size: 14pt;
      color: #374151;
      margin-top: 20px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .executive-summary {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    
    .risk-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 12pt;
      margin: 10px 0;
    }
    
    .risk-critical {
      background: #fef2f2;
      color: #991b1b;
      border: 2px solid #dc2626;
    }
    
    .risk-high {
      background: #fff7ed;
      color: #9a3412;
      border: 2px solid #ea580c;
    }
    
    .risk-medium {
      background: #fefce8;
      color: #854d0e;
      border: 2px solid #eab308;
    }
    
    .risk-low {
      background: #f0fdf4;
      color: #166534;
      border: 2px solid #22c55e;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 10pt;
    }
    
    thead {
      background: #f3f4f6;
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }
    
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .finding {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    
    .finding-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .severity-badge {
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9pt;
      text-transform: uppercase;
      margin-right: 12px;
    }
    
    .severity-critical {
      background: #dc2626;
      color: #ffffff;
    }
    
    .severity-high {
      background: #ea580c;
      color: #ffffff;
    }
    
    .severity-medium {
      background: #f59e0b;
      color: #ffffff;
    }
    
    .severity-low {
      background: #10b981;
      color: #ffffff;
    }
    
    .finding-title {
      font-size: 13pt;
      font-weight: 600;
      color: #111827;
      flex: 1;
    }
    
    .finding-section {
      margin: 12px 0;
    }
    
    .finding-label {
      font-weight: 600;
      color: #4b5563;
      margin-bottom: 4px;
    }
    
    .finding-content {
      color: #6b7280;
      line-height: 1.5;
    }
    
    .remediation-steps {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      margin-top: 12px;
    }
    
    .remediation-timeframe {
      margin-top: 12px;
    }
    
    .remediation-timeframe h4 {
      font-size: 10pt;
      color: #374151;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .remediation-steps ul {
      margin-left: 20px;
      color: #6b7280;
    }
    
    .remediation-steps li {
      margin: 4px 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 9pt;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }
    
    .key-findings {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
    }
    
    .key-findings ul {
      margin-left: 20px;
      margin-top: 10px;
    }
    
    .key-findings li {
      margin: 6px 0;
      color: #991b1b;
      font-weight: 500;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      font-size: 9pt;
      color: #9ca3af;
      text-align: center;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      color: #1f2937;
    }
    
    pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 9pt;
      line-height: 1.4;
      margin: 10px 0;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .finding {
        page-break-inside: avoid;
      }
      
      h2 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 OpenClaw Security Audit Report</h1>
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Scan ID:</span> ${metadata.scan_id}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Generated:</span> ${new Date(metadata.timestamp).toLocaleString()}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">ClawSec Version:</span> ${metadata.clawsec_version}
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Report Version:</span> ${metadata.report_version}
      </div>
    </div>
  </div>
  
  <div class="executive-summary">
    <h2>Executive Summary</h2>
    <p style="margin: 15px 0;">
      This security audit analyzed your OpenClaw configuration and identified 
      <strong>${summary.total_findings} security issue${summary.total_findings !== 1 ? 's' : ''}</strong>.
    </p>
    <div class="risk-badge risk-${summary.risk_level.toLowerCase()}">
      Overall Risk Level: ${summary.risk_level}
    </div>
    <p style="margin: 15px 0;">
      <strong>Risk Score:</strong> ${summary.risk_score}/100 (${summary.score_confidence} confidence)
    </p>
  </div>
  
  <h2>Risk Overview</h2>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value" style="color: #dc2626;">${summary.severity_distribution.critical}</div>
      <div class="stat-label">Critical</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #ea580c;">${summary.severity_distribution.high}</div>
      <div class="stat-label">High</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #f59e0b;">${summary.severity_distribution.medium}</div>
      <div class="stat-label">Medium</div>
    </div>
    <div class="stat-card">
      <div class="stat-value" style="color: #10b981;">${summary.severity_distribution.low}</div>
      <div class="stat-label">Low</div>
    </div>
  </div>
  
  ${summary.key_findings && summary.key_findings.length > 0 ? `
  <div class="key-findings">
    <h3 style="margin-top: 0; color: #991b1b;">⚠️ Key Findings</h3>
    <ul>
      ${summary.key_findings.map(finding => `<li>${finding}</li>`).join('\n      ')}
    </ul>
  </div>
  ` : ''}
  
  <h2>Severity Distribution</h2>
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Count</th>
        <th>Percentage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="severity-badge severity-critical">Critical</span></td>
        <td>${summary.severity_distribution.critical}</td>
        <td>${Math.round((summary.severity_distribution.critical / summary.total_findings) * 100)}%</td>
      </tr>
      <tr>
        <td><span class="severity-badge severity-high">High</span></td>
        <td>${summary.severity_distribution.high}</td>
        <td>${Math.round((summary.severity_distribution.high / summary.total_findings) * 100)}%</td>
      </tr>
      <tr>
        <td><span class="severity-badge severity-medium">Medium</span></td>
        <td>${summary.severity_distribution.medium}</td>
        <td>${Math.round((summary.severity_distribution.medium / summary.total_findings) * 100)}%</td>
      </tr>
      <tr>
        <td><span class="severity-badge severity-low">Low</span></td>
        <td>${summary.severity_distribution.low}</td>
        <td>${Math.round((summary.severity_distribution.low / summary.total_findings) * 100)}%</td>
      </tr>
    </tbody>
  </table>
  
  ${recommendations && recommendations.immediate_actions && recommendations.immediate_actions.length > 0 ? `
  <div class="page-break"></div>
  <h2>🚨 Immediate Actions Required</h2>
  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 6px; margin: 20px 0;">
    <p style="margin-bottom: 15px; color: #991b1b; font-weight: 600;">
      The following issues require immediate attention:
    </p>
    ${recommendations.immediate_actions.map(action => `
    <div style="margin: 15px 0; padding: 12px; background: #ffffff; border-radius: 4px;">
      <div style="font-weight: 600; color: #111827; margin-bottom: 6px;">
        ${action.title} <code style="background: #fee2e2; color: #991b1b; padding: 2px 6px;">${action.threat_id}</code>
      </div>
      <div style="color: #6b7280; font-size: 10pt;">
        ${action.action}
      </div>
    </div>
    `).join('\n    ')}
  </div>
  ` : ''}
  
  <div class="page-break"></div>
  <h2>Detailed Findings</h2>
  
  ${findings.map((finding, index) => `
  <div class="finding">
    <div class="finding-header">
      <span class="severity-badge severity-${finding.severity.toLowerCase()}">${finding.severity}</span>
      <span class="finding-title">${finding.title}</span>
      <code>${finding.threat_id}</code>
    </div>
    
    <div class="finding-section">
      <div class="finding-label">Description:</div>
      <div class="finding-content">${finding.description}</div>
    </div>
    
    <div class="finding-section">
      <div class="finding-label">Impact:</div>
      <div class="finding-content">${finding.impact}</div>
    </div>
    
    <div class="finding-section">
      <div class="finding-label">Likelihood:</div>
      <div class="finding-content">${finding.likelihood}</div>
    </div>
    
    ${finding.evidence && Object.keys(finding.evidence).length > 0 ? `
    <div class="finding-section">
      <div class="finding-label">Evidence:</div>
      <pre>${JSON.stringify(finding.evidence, null, 2)}</pre>
    </div>
    ` : ''}
    
    ${finding.remediation ? `
    <div class="remediation-steps">
      <h3 style="margin-top: 0; font-size: 11pt; color: #374151;">📋 Remediation Steps</h3>
      
      ${finding.remediation.immediate && finding.remediation.immediate.length > 0 ? `
      <div class="remediation-timeframe">
        <h4>⚡ Immediate (Today):</h4>
        <ul>
          ${finding.remediation.immediate.map(step => `<li>${step}</li>`).join('\n          ')}
        </ul>
      </div>
      ` : ''}
      
      ${finding.remediation.short_term && finding.remediation.short_term.length > 0 ? `
      <div class="remediation-timeframe">
        <h4>📅 Short-term (This Week):</h4>
        <ul>
          ${finding.remediation.short_term.map(step => `<li>${step}</li>`).join('\n          ')}
        </ul>
      </div>
      ` : ''}
      
      ${finding.remediation.long_term && finding.remediation.long_term.length > 0 ? `
      <div class="remediation-timeframe">
        <h4>📆 Long-term (Ongoing):</h4>
        <ul>
          ${finding.remediation.long_term.map(step => `<li>${step}</li>`).join('\n          ')}
        </ul>
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    ${finding.priority ? `
    <div style="margin-top: 12px; padding: 10px; background: #eff6ff; border-radius: 4px; font-size: 9pt;">
      <strong>Priority:</strong> ${finding.priority.level} 
      (Score: ${finding.priority.score}/100) | 
      <strong>Time to Fix:</strong> ${finding.priority.time_to_fix.duration} ${finding.priority.time_to_fix.unit}
    </div>
    ` : ''}
  </div>
  `).join('\n  ')}
  
  ${risk_analysis && risk_analysis.compliance_impact ? `
  <div class="page-break"></div>
  <h2>Compliance Impact</h2>
  
  ${risk_analysis.compliance_impact.owasp_llm_top10 ? `
  <h3>OWASP LLM Top 10</h3>
  <p style="margin: 10px 0; color: #6b7280;">
    Overall Compliance: <strong>${risk_analysis.compliance_impact.owasp_llm_top10.overall_compliance}%</strong> 
    (${risk_analysis.compliance_impact.owasp_llm_top10.compliant_categories}/${risk_analysis.compliance_impact.owasp_llm_top10.total_categories} categories compliant)
  </p>
  <p style="margin: 10px 0; color: #6b7280;">
    Risk Level: <strong>${risk_analysis.compliance_impact.owasp_llm_top10.overall_risk}</strong>
  </p>
  ` : ''}
  
  ${risk_analysis.compliance_impact.gdpr_considerations && risk_analysis.compliance_impact.gdpr_considerations.issues_found > 0 ? `
  <h3>GDPR Considerations</h3>
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p style="color: #92400e; margin-bottom: 10px;">
      <strong>${risk_analysis.compliance_impact.gdpr_considerations.issues_found} GDPR compliance issue${risk_analysis.compliance_impact.gdpr_considerations.issues_found !== 1 ? 's' : ''} identified</strong>
    </p>
    ${risk_analysis.compliance_impact.gdpr_considerations.compliance_concerns.map(concern => `
    <div style="margin: 10px 0; padding: 10px; background: #ffffff; border-radius: 4px;">
      <div style="font-weight: 600; color: #78350f; margin-bottom: 4px;">
        ${concern.article} | <span class="severity-badge severity-${concern.severity.toLowerCase()}">${concern.severity}</span>
      </div>
      <div style="font-size: 10pt; color: #6b7280; margin-bottom: 4px;">
        <strong>Issue:</strong> ${concern.issue}
      </div>
      <div style="font-size: 10pt; color: #6b7280;">
        ${concern.description}
      </div>
    </div>
    `).join('\n    ')}
  </div>
  ` : ''}
  ` : ''}
  
  <div class="page-break"></div>
  <h2>Next Steps</h2>
  
  ${jsonReport.next_steps ? `
  <h3>⚡ Immediate</h3>
  <ul style="margin-left: 20px; margin-bottom: 20px;">
    ${jsonReport.next_steps.immediate.map(step => `<li style="margin: 6px 0;">${step}</li>`).join('\n    ')}
  </ul>
  
  <h3>📅 Short-term</h3>
  <ul style="margin-left: 20px; margin-bottom: 20px;">
    ${jsonReport.next_steps.short_term.map(step => `<li style="margin: 6px 0;">${step}</li>`).join('\n    ')}
  </ul>
  
  <h3>📆 Long-term</h3>
  <ul style="margin-left: 20px;">
    ${jsonReport.next_steps.long_term.map(step => `<li style="margin: 6px 0;">${step}</li>`).join('\n    ')}
  </ul>
  ` : ''}
  
  <div class="footer">
    <p>Generated by ClawSec ${metadata.clawsec_version} | ${new Date(metadata.timestamp).toLocaleString()}</p>
    <p style="margin-top: 8px;">For support: <a href="https://github.com/ClawSecAI/ClawSec-skill" style="color: #2563eb;">https://github.com/ClawSecAI/ClawSec-skill</a></p>
  </div>
</body>
</html>
`;
  
  return html;
}

/**
 * Generate a PDF report buffer from JSON report data
 * 
 * @param {Object} jsonReport - Complete JSON report from generateJSONReport()
 * @param {Object} options - PDF generation options
 * @param {string} options.format - PDF format ('A4', 'Letter', etc.)
 * @param {boolean} options.printBackground - Include background colors
 * @param {boolean} options.preferCSSPageSize - Use CSS @page size
 * @param {Object} options.margin - Page margins
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDFReport(jsonReport, options = {}) {
  const {
    format = 'A4',
    printBackground = true,
    preferCSSPageSize = false,
    margin = {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  } = options;
  
  // Generate HTML from JSON report
  const html = generateHTMLReport(jsonReport);
  
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Overcome limited resource problems
      '--disable-gpu'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2 // Higher resolution for better quality
    });
    
    // Load HTML content
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    const pdf = await page.pdf({
      format,
      printBackground,
      preferCSSPageSize,
      margin
    });
    
    return pdf;
    
  } finally {
    await browser.close();
  }
}

/**
 * Generate PDF report from scan results (convenience wrapper)
 * 
 * @param {string} scanId - Unique scan identifier
 * @param {Object} scanInput - Original scan input configuration
 * @param {Array} findings - Array of security findings
 * @param {Object} threatsIndex - Threat database index
 * @param {Object} scoreResult - Risk score calculation result
 * @param {Object} prioritized - Prioritized recommendations
 * @param {Object} optimization - Token optimization statistics
 * @param {Object} pdfOptions - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDFFromScan(scanId, scanInput, findings, threatsIndex, scoreResult, prioritized, optimization, pdfOptions = {}) {
  // Generate JSON report first
  const jsonReport = generateJSONReport(
    scanId,
    scanInput,
    findings,
    threatsIndex,
    scoreResult,
    prioritized,
    optimization
  );
  
  // Generate PDF from JSON
  return await generatePDFReport(jsonReport, pdfOptions);
}

module.exports = {
  generateHTMLReport,
  generatePDFReport,
  generatePDFFromScan
};
