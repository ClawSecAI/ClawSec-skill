# ClawSec: Hackathon Process Summary

**One-Sentence Explanation Per Step**

---

## User Interaction Model

**How users invoke ClawSec:**
- **Natural Language** - No special commands required, just say: "Run a security audit" or "Check my OpenClaw for vulnerabilities"
- **Works in Telegram/WhatsApp/Discord** - Regular chat messages, no `/clawsec` or `/audit` commands needed
- **Agent recognizes intent** - OpenClaw's skill system automatically activates ClawSec when security audit is requested

**Payment Model:**
- **Autonomous Mode (Default)** - Agent has its own USDC wallet, signs payments automatically, user just asks and receives results
- **Interactive Mode (Optional)** - Agent prompts user to approve payment in MetaMask/Coinbase Wallet via WalletConnect

**Demo UX:**
```
User: "Check my OpenClaw security"
Agent: "Running ClawSec audit... (payment: $0.01 USDC)"
       [2 seconds later]
Agent: "⚠️ Audit Complete | Risk Score: 85/100 (CRITICAL)
       🔴 IMMEDIATE: Weak gateway token, Public exposure
       💰 Payment confirmed: 0xabc123..."
```

---

## Phase 1: Skill Installation

**User installs the ClawSec skill into their OpenClaw instance via CLI (`openclaw skills install clawsec`) or marketplace, which loads the natural language skill instructions from SKILL.md.**

---

## Phase 2: Scan & Sanitization

**The OpenClaw agent scans the user's configuration files (gateway, sessions, tools, channels) and automatically sanitizes sensitive data (API keys, emails, IPs) using 70+ credential detection patterns, preparing a safe payload for transmission.**

---

## Phase 3: Payment Preparation

**The agent displays pricing options ($0.01 for basic, $0.03 for thorough scans) and prepares payment using its configured USDC wallet on Base network (autonomous mode) or prompts the user to connect their wallet (interactive mode).**

---

## Phase 4: Audit Request (Initial)

**The ClawSec skill sends the sanitized data to the ClawSec API for analysis, which responds with HTTP 402 Payment Required and a PAYMENT-REQUIRED header containing X402 protocol payment instructions (amount, recipient wallet, network).**

---

## Phase 5: Payment Processing

**The agent's wallet automatically signs the USDC payment transaction (autonomous mode) or prompts user approval (interactive mode), the X402 client creates a payment signature payload and retries the audit request with the PAYMENT-SIGNATURE header, then the Coinbase facilitator verifies the signature and confirms the payment is valid before allowing the audit to proceed.**

---

## Phase 6: Report Generation

**The ClawSec API analyzes the configuration using pattern matching against a threat database, calculates a 0-100 risk score, prioritizes findings by severity (P0-P3), maps issues to OWASP LLM Top 10 categories, and optionally enhances the report with Claude AI insights.**

---

## Phase 7: Report Delivery

**The server caches the complete report for 24 hours and returns it to the client with a PAYMENT-RESPONSE header confirming blockchain settlement, then the agent formats and presents the findings to the user with immediate action recommendations.**

---

## Phase 8: Payment Finalization

**The Coinbase facilitator broadcasts the signed USDC transaction to the Base blockchain, transfers funds from the user's wallet to the ClawSec receiving wallet, and records the transaction hash on-chain for permanent verification.**

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Client** | OpenClaw Skill (Node.js) | Configuration gathering & sanitization |
| **Payment Protocol** | X402 v2 | HTTP-native USDC payments |
| **Blockchain** | Base (Ethereum L2) | Low-cost, fast USDC transactions |
| **Token** | USDC | Stablecoin payment ($1 = 1 USDC) |
| **Facilitator** | Coinbase CDP | Payment verification & settlement |
| **API Server** | Express.js on Railway | Threat analysis & report generation |
| **AI Analysis** | Claude (Anthropic) | Enhanced security insights |
| **Threat Database** | 50+ categorized threats | Pattern matching & remediation |

---

## Key Innovation

**ClawSec combines AI-powered security analysis with X402 blockchain payments, enabling OpenClaw users to receive instant security audits paid in USDC without subscriptions, accounts, or manual invoicing—just request a scan, sign a payment, and receive actionable security recommendations in under 60 seconds.**

---

## Hackathon Value Proposition

**Problem:** OpenClaw users have no way to audit their configurations for security vulnerabilities, leading to exposed credentials, weak tokens, and misconfigured access controls.

**Solution:** ClawSec provides instant, AI-powered security audits as a pay-per-scan service using USDC on Base, making professional security analysis accessible without enterprise contracts.

**Why X402 Matters:** Traditional payment APIs require account setup, credit cards, and complex integration—X402 lets users pay directly with USDC via a simple HTTP payment flow, perfect for AI agents making autonomous purchases.

**Impact:** Any OpenClaw user can run a security audit in under 60 seconds for $0.01-0.03, detecting critical vulnerabilities before they're exploited, all paid seamlessly with blockchain-based micropayments.

---

**Document Version:** Hackathon Submission  
**Created:** 2026-02-07  
**Author:** Ubik (@ClawSecAI)
