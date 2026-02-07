/**
 * ClawSec LLM-Enhanced Security Analyzer
 * Premium Tier Feature - Claude Sonnet Analysis
 * 
 * @version 1.0.0
 * @author Ubik (@ClawSecAI)
 * @created 2026-02-07
 * 
 * Provides advanced security analysis for premium tier ($3) using Claude Sonnet:
 * - Attack chain identification (how findings combine into exploits)
 * - Contextual severity analysis (why THIS config makes findings critical)
 * - Smart prioritization (order fixes by max security improvement)
 * - Natural language executive summary
 * - Configuration-specific recommendations
 * 
 * CRITICAL: Only called for premium tier. Basic tier uses pattern matching only.
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Initialize Anthropic client
 */
function createLLMClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured. Set in .env file for premium tier analysis.');
  }
  
  return new Anthropic({
    apiKey: apiKey
  });
}

/**
 * Build LLM prompt for security analysis
 * 
 * @param {Array} findings - Detected security findings from pattern matching
 * @param {Object} optimizedContext - Threat intelligence context
 * @param {Object} scoreResult - Risk score calculation result
 * @param {Object} scanConfig - Original scan configuration (for context)
 * @returns {string} Formatted prompt for Claude
 */
function buildAnalysisPrompt(findings, optimizedContext, scoreResult, scanConfig) {
  // Format findings for LLM
  const findingsSummary = findings.map(f => ({
    threat_id: f.threat_id,
    severity: f.severity,
    title: f.title,
    description: f.description,
    impact: f.impact,
    likelihood: f.likelihood,
    evidence: f.evidence
  }));
  
  // Extract threat intelligence context
  const threatIntel = optimizedContext.categories.map(cat => ({
    category: cat.name,
    threats: cat.content.substring(0, 500) // First 500 chars of each category
  }));
  
  const prompt = `You are a security analyst reviewing an OpenClaw AI agent configuration for vulnerabilities.

DETECTED SECURITY ISSUES (${findings.length} findings):
${JSON.stringify(findingsSummary, null, 2)}

THREAT INTELLIGENCE CONTEXT:
${JSON.stringify(threatIntel, null, 2)}

RISK ASSESSMENT:
- Risk Score: ${scoreResult.score}/100
- Risk Level: ${scoreResult.level}
- Confidence: ${scoreResult.confidence}
- Severity Distribution: ${scoreResult.breakdown.severityDistribution.critical} critical, ${scoreResult.breakdown.severityDistribution.high} high, ${scoreResult.breakdown.severityDistribution.medium} medium, ${scoreResult.breakdown.severityDistribution.low} low

CONFIGURATION OVERVIEW:
${JSON.stringify(scanConfig, null, 2).substring(0, 1000)}

ANALYSIS INSTRUCTIONS:

Analyze these findings and provide:

1. **Attack Chains** - Identify how multiple findings can be chained together into exploits
   - Look for combinations that enable multi-stage attacks
   - Explain realistic attack scenarios
   - Rate likelihood of each chain (HIGH/MEDIUM/LOW)

2. **Contextual Severity** - Explain why these findings are critical IN THIS SPECIFIC CONFIGURATION
   - Consider the OpenClaw environment (AI agent with tools, skills, sessions)
   - Identify what makes each finding particularly dangerous here
   - Highlight unique risk factors in this configuration

3. **Smart Prioritization** - Order fixes by maximum security improvement
   - Consider: severity, exploitability, fix difficulty, cascading benefits
   - Identify "quick wins" (high impact, low effort)
   - Highlight critical dependencies (fix A before B)

4. **Executive Summary** - 2-3 business-friendly sentences
   - Clear, non-technical language
   - Focus on business impact and risk
   - Include recommended timeline for remediation

5. **Configuration-Specific Recommendations** - Tailored advice for THIS system
   - Specific commands, config changes, tools to use
   - Prioritized action items with timelines
   - Verification steps after fixes

OUTPUT FORMAT (JSON):
{
  "executive_summary": "Business-friendly 2-3 sentence summary",
  "attack_chains": [
    {
      "name": "Attack chain name",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "involved_findings": ["T001", "T002"],
      "likelihood": "HIGH|MEDIUM|LOW",
      "impact": "Description of impact if exploited",
      "mitigation": "How to break this chain"
    }
  ],
  "contextualized_priorities": [
    {
      "threat_id": "T001",
      "priority_rank": 1,
      "reasoning": "Why this is priority #1 for THIS configuration",
      "security_improvement": "What fixing this achieves",
      "fix_difficulty": "EASY|MODERATE|HARD",
      "estimated_time": "Time estimate (e.g., '15 minutes')"
    }
  ],
  "recommendations": [
    {
      "title": "Recommendation title",
      "priority": "P0|P1|P2|P3",
      "actions": ["Specific action 1", "Specific action 2"],
      "timeline": "When to do this (e.g., 'Today', 'This week')",
      "verification": "How to verify the fix worked"
    }
  ],
  "risk_factors": [
    {
      "factor": "Risk factor name",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "description": "Why this matters in this configuration",
      "affected_findings": ["T001", "T002"]
    }
  ]
}

IMPORTANT:
- Be specific to THIS configuration, not generic security advice
- Focus on realistic attacks, not theoretical scenarios
- Prioritize actionable recommendations with clear steps
- Use OpenClaw-specific terminology (gateway, skills, tools, sessions)
- Keep executive summary under 3 sentences
- Return ONLY valid JSON, no markdown or explanation`;

  return prompt;
}

/**
 * Call Claude API for premium tier analysis
 * 
 * @param {Array} findings - Security findings from pattern matching
 * @param {Object} optimizedContext - Threat intelligence context
 * @param {Object} scoreResult - Risk score result
 * @param {Object} scanConfig - Scan configuration
 * @returns {Promise<Object>} LLM analysis result
 */
async function analyzePremiumTier(findings, optimizedContext, scoreResult, scanConfig) {
  // Graceful fallback if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY not set. Premium tier analysis unavailable.');
    console.warn('   Set ANTHROPIC_API_KEY in .env to enable LLM-enhanced analysis.');
    return {
      available: false,
      reason: 'ANTHROPIC_API_KEY not configured',
      fallback: true
    };
  }
  
  try {
    const client = createLLMClient();
    const prompt = buildAnalysisPrompt(findings, optimizedContext, scoreResult, scanConfig);
    
    console.log('🧠 Calling Claude Sonnet for premium tier analysis...');
    const startTime = Date.now();
    
    // Call Claude API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for consistent, focused analysis
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ LLM analysis complete (${duration}ms)`);
    
    // Extract text content from response
    const textContent = response.content[0].text;
    
    // Parse JSON response
    let analysis;
    try {
      // Claude might wrap JSON in markdown code blocks, so clean it
      const cleanedText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response as JSON:', parseError.message);
      console.error('Raw response:', textContent.substring(0, 500));
      
      // Return raw text as fallback
      return {
        available: true,
        raw_analysis: textContent,
        parse_error: parseError.message,
        fallback: true
      };
    }
    
    // Validate required fields
    const requiredFields = ['executive_summary', 'attack_chains', 'contextualized_priorities', 'recommendations'];
    const missingFields = requiredFields.filter(field => !analysis[field]);
    
    if (missingFields.length > 0) {
      console.warn(`⚠️  LLM response missing fields: ${missingFields.join(', ')}`);
    }
    
    // Return structured analysis
    return {
      available: true,
      executive_summary: analysis.executive_summary || '',
      attack_chains: analysis.attack_chains || [],
      contextualized_priorities: analysis.contextualized_priorities || [],
      recommendations: analysis.recommendations || [],
      risk_factors: analysis.risk_factors || [],
      metadata: {
        model: 'claude-sonnet-4-5',
        duration_ms: duration,
        tokens_used: response.usage?.total_tokens || 0,
        input_tokens: response.usage?.input_tokens || 0,
        output_tokens: response.usage?.output_tokens || 0
      }
    };
    
  } catch (error) {
    console.error('❌ LLM analysis error:', error.message);
    
    // Return error with graceful fallback
    return {
      available: false,
      error: error.message,
      fallback: true
    };
  }
}

/**
 * Merge LLM insights into existing report
 * 
 * @param {Object} baseReport - Report object from pattern matching
 * @param {Object} llmAnalysis - LLM analysis result
 * @returns {Object} Enhanced report with LLM insights
 */
function enhanceReportWithLLM(baseReport, llmAnalysis) {
  // If LLM analysis not available, return base report unchanged
  if (!llmAnalysis.available || llmAnalysis.fallback) {
    return {
      ...baseReport,
      premium_tier: {
        llm_analysis: false,
        reason: llmAnalysis.reason || llmAnalysis.error || 'LLM analysis unavailable'
      }
    };
  }
  
  // Add LLM insights to report
  return {
    ...baseReport,
    premium_tier: {
      llm_analysis: true,
      executive_summary: llmAnalysis.executive_summary,
      attack_chains: llmAnalysis.attack_chains,
      contextualized_priorities: llmAnalysis.contextualized_priorities,
      recommendations: llmAnalysis.recommendations,
      risk_factors: llmAnalysis.risk_factors,
      metadata: llmAnalysis.metadata
    }
  };
}

/**
 * Add LLM insights to markdown report
 * 
 * @param {string} baseMarkdown - Base markdown report
 * @param {Object} llmAnalysis - LLM analysis result
 * @returns {string} Enhanced markdown with LLM sections
 */
function enhanceMarkdownWithLLM(baseMarkdown, llmAnalysis) {
  // If LLM analysis not available, return base markdown
  if (!llmAnalysis.available || llmAnalysis.fallback) {
    return baseMarkdown;
  }
  
  let enhanced = baseMarkdown;
  
  // Insert LLM executive summary after main executive summary
  if (llmAnalysis.executive_summary) {
    const summarySection = `\n### 🧠 AI-Enhanced Executive Summary (Premium)\n\n${llmAnalysis.executive_summary}\n\n`;
    enhanced = enhanced.replace(/(\*\*Risk Score\*\*:)/, summarySection + '$1');
  }
  
  // Add attack chains section before detailed findings
  if (llmAnalysis.attack_chains && llmAnalysis.attack_chains.length > 0) {
    let attackChainSection = `## 🔗 Attack Chains (Premium Analysis)\n\n`;
    attackChainSection += `*AI-identified attack scenarios that combine multiple vulnerabilities*\n\n`;
    
    llmAnalysis.attack_chains.forEach((chain, i) => {
      attackChainSection += `### ${i + 1}. ${chain.name}\n\n`;
      attackChainSection += `**Likelihood**: ${chain.likelihood} | **Involved Findings**: ${chain.involved_findings.join(', ')}\n\n`;
      attackChainSection += `**Attack Steps**:\n`;
      chain.steps.forEach((step, j) => {
        attackChainSection += `${j + 1}. ${step}\n`;
      });
      attackChainSection += `\n**Impact**: ${chain.impact}\n\n`;
      attackChainSection += `**Mitigation**: ${chain.mitigation}\n\n`;
      attackChainSection += `---\n\n`;
    });
    
    // Insert before "Detailed Findings" section
    enhanced = enhanced.replace(/(## Detailed Findings)/, attackChainSection + '$1');
  }
  
  // Add contextualized priorities section
  if (llmAnalysis.contextualized_priorities && llmAnalysis.contextualized_priorities.length > 0) {
    let prioritySection = `## 🎯 Smart Prioritization (Premium Analysis)\n\n`;
    prioritySection += `*AI-ranked fixes by maximum security improvement*\n\n`;
    
    llmAnalysis.contextualized_priorities.forEach((item, i) => {
      prioritySection += `### Priority #${item.priority_rank}: ${item.threat_id}\n\n`;
      prioritySection += `**Reasoning**: ${item.reasoning}\n\n`;
      prioritySection += `**Security Improvement**: ${item.security_improvement}\n\n`;
      prioritySection += `**Difficulty**: ${item.fix_difficulty} | **Estimated Time**: ${item.estimated_time}\n\n`;
      prioritySection += `---\n\n`;
    });
    
    // Insert after Risk Breakdown
    enhanced = enhanced.replace(/(---\n\n## Detailed Findings)/, prioritySection + '$1');
  }
  
  // Add premium recommendations section
  if (llmAnalysis.recommendations && llmAnalysis.recommendations.length > 0) {
    let recoSection = `## 💡 Configuration-Specific Recommendations (Premium)\n\n`;
    
    llmAnalysis.recommendations.forEach((reco, i) => {
      recoSection += `### ${reco.priority} - ${reco.title}\n\n`;
      recoSection += `**Timeline**: ${reco.timeline}\n\n`;
      recoSection += `**Actions**:\n`;
      reco.actions.forEach((action, j) => {
        recoSection += `- [ ] ${action}\n`;
      });
      recoSection += `\n**Verification**: ${reco.verification}\n\n`;
      recoSection += `---\n\n`;
    });
    
    // Insert before Next Steps
    enhanced = enhanced.replace(/(## Next Steps)/, recoSection + '$1');
  }
  
  // Add premium tier badge to footer
  const premiumBadge = `\n*✨ Premium Tier Analysis powered by Claude Sonnet (${llmAnalysis.metadata?.duration_ms || 0}ms)*\n`;
  enhanced = enhanced.replace(/(\*Generated by ClawSec)/, premiumBadge + '$1');
  
  return enhanced;
}

module.exports = {
  analyzePremiumTier,
  enhanceReportWithLLM,
  enhanceMarkdownWithLLM,
  createLLMClient,
  buildAnalysisPrompt
};
