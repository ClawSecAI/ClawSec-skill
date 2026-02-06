# Security Analysis Prompt - Basic Scan

You are a security expert analyzing an OpenClaw configuration audit. Your task is to enhance the security report with deeper insights, prioritization, and actionable recommendations.

**Context:**
You are analyzing a security scan of an OpenClaw instance (an AI agent platform). The rule-based scanner has identified 4 security issues with an overall risk level of HIGH.

**Threat Intelligence Context (Excerpt):**

**T001 - Weak Gateway Token (CRITICAL)**
- Token authentication is the primary access control
- Weak tokens enable complete system compromise
- Attack scenario: Port scanning → token guessing → full access
- Common patterns: "test", "admin", dictionary words, short length

**T002 - Public Gateway Exposure (HIGH)**
- Binding to 0.0.0.0 exposes gateway to all network interfaces
- Increases attack surface dramatically
- Should use 127.0.0.1 (localhost) unless remote access required
- Combine with firewall rules if public access needed

**T015 - Unrestricted Command Execution (HIGH)**
- Exec tool with "allow-all" permits arbitrary system commands
- Post-compromise, enables data exfiltration and lateral movement
- Should use allowlist policy with specific commands only

**T032 - Missing Telegram Whitelist (MEDIUM)**
- Bot responds to any chat without restrictions
- Anyone discovering bot can interact with agent
- Should restrict to specific chat IDs

**Scan Results:**
```json
{
  "scan_id": "test-basic-001",
  "findings_count": 4,
  "risk_level": "HIGH",
  "risk_score": 78,
  "findings": [
    {
      "id": "T001",
      "title": "Weak Gateway Token",
      "severity": "CRITICAL",
      "impact": "Complete system compromise. Attacker gains unauthorized access to all sessions, can execute commands, read conversation history.",
      "likelihood": "HIGH",
      "remediation": "Generate strong 64-character random token using: openssl rand -hex 32"
    },
    {
      "id": "T002",
      "title": "Public Gateway Exposure",
      "severity": "HIGH",
      "impact": "Increases attack surface. Combined with weak token, enables remote exploitation.",
      "remediation": "Change bind to '127.0.0.1' unless remote access explicitly needed."
    },
    {
      "id": "T015",
      "title": "Unrestricted Command Execution",
      "severity": "HIGH",
      "impact": "Enables arbitrary system commands if gateway compromised.",
      "remediation": "Switch to 'allowlist' policy with only required commands."
    },
    {
      "id": "T032",
      "title": "Missing Telegram Chat Whitelist",
      "severity": "MEDIUM",
      "impact": "Anyone discovering bot can interact with OpenClaw instance.",
      "remediation": "Add allowed_chats array with specific chat IDs."
    }
  ]
}
```

**Your Task:**
Generate an enhanced security audit report (approximately 1000-1500 words) that includes:

1. **Executive Summary** (2-3 paragraphs)
   - Overview of security posture
   - Critical risk factors
   - Business impact assessment

2. **Prioritized Action Plan**
   - Group findings by urgency and impact
   - Provide clear, step-by-step remediation
   - Estimate implementation effort (hours/days)

3. **Deep Analysis**
   - Explain attack scenarios for each finding
   - Assess likelihood of exploitation
   - Identify cascading vulnerabilities (how issues compound)

4. **Security Roadmap**
   - Immediate fixes (today)
   - Short-term improvements (this week)
   - Long-term security hardening

5. **Compliance & Best Practices**
   - Map findings to OWASP LLM Top 10
   - Privacy considerations
   - Industry best practices

**Output Format:**
Provide a professional, markdown-formatted security report that is:
- Actionable and specific
- Easy to understand for non-technical stakeholders
- Technically accurate for security engineers
- Prioritized by risk and impact

Be concise but thorough. Use concrete examples. Provide code snippets for fixes where applicable. Highlight quick wins vs. complex fixes.

---

**Generate the security report now:**
