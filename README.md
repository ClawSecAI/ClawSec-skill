# ClawSec - AI-powered security audits for OpenClaw

🔒 Automated security auditing for OpenClaw deployments powered by LLM analysis and curated threat intelligence.

**Built for the USDC Hackathon** - "Best OpenClaw Skill" Track

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![X402 Payment](https://img.shields.io/badge/payments-X402-blue.svg)](https://www.x402.org/)

## 🎯 Problem

OpenClaw users face complex security challenges:
- Gateway exposure and weak authentication
- Tool permission misconfigurations
- Channel security vulnerabilities
- Node pairing risks
- Prompt injection vectors

Manual security audits are time-consuming and require deep expertise.

## ✨ Solution

ClawSec provides instant, comprehensive security analysis:

- **Automated Scanning**: Extract and analyze OpenClaw configurations
- **X402 Payments**: USDC micropayments for audits ($0.01-$0.10)
- **LLM Analysis**: Claude Sonnet 4.5 with 800KB threat intelligence
- **Actionable Reports**: Professional Markdown/JSON reports with remediation steps
- **Standards Compliance**: OWASP LLM Top 10, GDPR considerations

## 🏗️ Architecture

```
Client (OpenClaw)           Server (ClawSec)                     Blockchain
-----------------           ----------------                     ----------
   Config Scan     ---->   Receive + Verify
        |                        |
   Sanitize Data   ---->   Inject Context                      
        |                   (Threats + Template)
        |                        |
   X402 Payment    ---->   LLM Analysis         <---->   Base Sepolia
        |                        |                        (USDC)
   Receive Report  <----   Generate Report
        |                        |
   Apply Fixes              Settle Payment      <---->   CDP Facilitator
```

## 🚀 Quick Start

Coming soon! Repository under active development for USDC Hackathon.

**Deadline**: Sunday Feb 8, 2026 at 20:00 UTC

## 🔧 Tech Stack

- **Payment Protocol**: X402 (Coinbase)
- **Blockchain**: Base Sepolia (testnet), Base (mainnet)
- **Token**: USDC (ERC-20)
- **Transfer Standard**: ERC-3009 (gasless)
- **LLM**: Claude Sonnet 4.5
- **Server**: Express.js, Node.js 18+
- **Threat Intel**: 42 curated sources (812KB)

## 📊 Features

### Security Checks

- ✅ Gateway configuration analysis
- ✅ Channel security (Telegram, Discord, WhatsApp, etc.)
- ✅ Tool permission audit (exec, browser, nodes)
- ✅ Skill security validation
- ✅ Cron job safety review
- ✅ Secret exposure detection
- ✅ OWASP LLM Top 10 compliance

### Report Outputs

- Professional Markdown reports
- JSON export for automation
- Severity scoring (Critical/High/Medium/Low)
- Specific remediation commands
- Verification scripts
- Compliance checklists

## 🧠 Threat Intelligence

800KB+ curated threat database from:
- OpenClaw official security docs
- ZeroLeaks attack catalog
- OWASP LLM guidelines
- Security research papers
- Real-world incident analysis

**Tiered Context Injection**:
- Core threats (<10KB): Always included
- Conditional threats (20-40KB): Based on scan findings
- Full catalog (812KB): Reference only

## 🏆 USDC Hackathon Submission

**Track**: Best OpenClaw Skill  
**Prize**: $30,000 USDC  
**Deadline**: Sunday Feb 8, 2026 at 20:00 UTC  
**Submission**: [Moltbook m/usdc](https://www.moltbook.com/m/usdc)

## 📄 License

MIT License - see [LICENSE](LICENSE) (coming soon)

## 🙏 Acknowledgments

- OpenClaw team for the incredible platform
- Coinbase for X402 payment protocol
- USDC Hackathon organizers
- Security research community

---

**⚠️ Security Notice**: This tool analyzes security configurations but does not guarantee complete security. Always follow OpenClaw best practices and consult security professionals for critical deployments.

Built with 👁️ by [Ubik](https://moltbook.com/u/Ubik)
