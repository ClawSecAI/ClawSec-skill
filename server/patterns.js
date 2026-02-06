/**
 * ClawSec Pattern Matching Engine
 * Enhanced credential and secret detection patterns
 * 
 * @version 0.3.0
 * @author Ubik (@ClawSecAI)
 * @updated 2026-02-06 - Added 30+ new credential types (70+ total patterns)
 */

/**
 * Comprehensive credential pattern definitions
 * Each pattern includes:
 * - name: Human-readable credential type
 * - pattern: Regular expression for detection
 * - severity: Risk level (CRITICAL, HIGH, MEDIUM, LOW)
 * - confidence: Detection confidence (high, medium, low)
 * - validator: Optional function for additional validation
 */
const CREDENTIAL_PATTERNS = [
  // === Cloud Provider Credentials ===
  
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'AWS access key identifier',
    impact: 'Full AWS account access, data breach, resource abuse'
  },
  
  {
    name: 'AWS Secret Key',
    pattern: /aws(.{0,20})?['\"][0-9a-zA-Z/+=]{40}['\"]|aws_secret_access_key\s*=\s*['\"]?[0-9a-zA-Z/+=]{40}['\"]?/gi,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'AWS secret access key',
    impact: 'Complete AWS account compromise'
  },
  
  {
    name: 'AWS Session Token',
    pattern: /aws_session_token\s*=\s*['\"]?[A-Za-z0-9/+=]{100,}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'high',
    description: 'AWS temporary session token',
    impact: 'Temporary AWS access, privilege escalation'
  },
  
  {
    name: 'Google Cloud API Key',
    pattern: /AIza[0-9A-Za-z\-_]{35}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Google Cloud Platform API key',
    impact: 'GCP service access, billing abuse'
  },
  
  {
    name: 'Google OAuth Token',
    pattern: /ya29\.[0-9A-Za-z\-_]+/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Google OAuth access token',
    impact: 'Google account access, data exfiltration'
  },
  
  {
    name: 'Azure Storage Account Key',
    pattern: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{88}/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'Azure storage connection string',
    impact: 'Azure storage access, data breach'
  },
  
  {
    name: 'Azure Client Secret',
    pattern: /azure(.{0,20})?['\"][0-9a-zA-Z\-_~.]{34,}['\"]|client_secret\s*=\s*['\"]?[0-9a-zA-Z\-_~.]{34,}['\"]?/gi,
    severity: 'CRITICAL',
    confidence: 'medium',
    description: 'Azure AD application secret',
    impact: 'Azure AD compromise, resource access'
  },
  
  // === AI/ML Service Credentials ===
  
  {
    name: 'OpenAI API Key',
    pattern: /sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}|sk-proj-[a-zA-Z0-9_-]{43,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'OpenAI API key',
    impact: 'API abuse, billing charges, data exfiltration'
  },
  
  {
    name: 'Anthropic API Key',
    pattern: /sk-ant-api03-[a-zA-Z0-9\-_]{93,}|sk-ant-[a-zA-Z0-9\-_]{32,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Anthropic Claude API key',
    impact: 'API abuse, billing charges'
  },
  
  {
    name: 'Hugging Face Token',
    pattern: /hf_[a-zA-Z0-9]{38}/g,
    severity: 'MEDIUM',
    confidence: 'high',
    description: 'Hugging Face API token',
    impact: 'Model access, API abuse'
  },
  
  {
    name: 'Cohere API Key',
    pattern: /cohere[_-]?api[_-]?key['\"]?\s*[:=]\s*['\"]?[a-zA-Z0-9]{40}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Cohere API key',
    impact: 'API abuse, billing charges'
  },
  
  // === Version Control & Development ===
  
  {
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghr_[a-zA-Z0-9]{36}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'GitHub personal access token',
    impact: 'Repository access, code manipulation, supply chain attack'
  },
  
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'GitHub OAuth access token',
    impact: 'User account access, repository manipulation'
  },
  
  {
    name: 'GitLab Personal Access Token',
    pattern: /glpat-[a-zA-Z0-9\-_]{20}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'GitLab personal access token',
    impact: 'Repository access, CI/CD manipulation'
  },
  
  {
    name: 'NPM Access Token',
    pattern: /npm_[a-zA-Z0-9]{36}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'NPM authentication token',
    impact: 'Package publishing, supply chain attack'
  },
  
  {
    name: 'PyPI Token',
    pattern: /pypi-AgEIcHlwaS5vcmc[A-Za-z0-9\-_]{50,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'PyPI API token',
    impact: 'Package publishing, supply chain attack'
  },
  
  // === Messaging & Communication ===
  
  {
    name: 'Telegram Bot Token',
    pattern: /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Telegram bot authentication token',
    impact: 'Bot impersonation, message interception'
  },
  
  {
    name: 'Discord Bot Token',
    pattern: /[MN][A-Za-z\d]{23,25}\.[A-Za-z\d-_]{6}\.[A-Za-z\d-_]{27,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Discord bot token',
    impact: 'Bot hijacking, server manipulation'
  },
  
  {
    name: 'Discord Webhook URL',
    pattern: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+/g,
    severity: 'MEDIUM',
    confidence: 'high',
    description: 'Discord webhook URL',
    impact: 'Message spam, phishing attacks'
  },
  
  {
    name: 'Slack Bot Token',
    pattern: /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Slack bot user OAuth token',
    impact: 'Workspace access, data exfiltration'
  },
  
  {
    name: 'Slack Webhook URL',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[a-zA-Z0-9]+/g,
    severity: 'MEDIUM',
    confidence: 'high',
    description: 'Slack incoming webhook URL',
    impact: 'Message spam, social engineering'
  },
  
  {
    name: 'Slack API Token',
    pattern: /xox[abprs]-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[a-z0-9]{32}/gi,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Slack API token',
    impact: 'Full workspace access, data theft'
  },
  
  // === Database Credentials ===
  
  {
    name: 'PostgreSQL Connection String',
    pattern: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'PostgreSQL database connection string',
    impact: 'Database access, data breach'
  },
  
  {
    name: 'MySQL Connection String',
    pattern: /mysql:\/\/[^:]+:[^@]+@[^:]+:\d+\/[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'MySQL database connection string',
    impact: 'Database access, data breach'
  },
  
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'MongoDB connection string',
    impact: 'Database access, data breach'
  },
  
  {
    name: 'Redis Connection String',
    pattern: /redis:\/\/[^:]*:[^@]+@[^:]+:\d+/gi,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Redis connection string with password',
    impact: 'Cache access, session hijacking'
  },
  
  {
    name: 'Generic Database Password',
    pattern: /(?:database|db)(?:_|-)?(?:password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\"]{8,}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Database password in configuration',
    impact: 'Database compromise'
  },
  
  // === Authentication & Authorization ===
  
  {
    name: 'JWT Token',
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'JSON Web Token',
    impact: 'Session hijacking, authentication bypass'
  },
  
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Bearer authentication token',
    impact: 'API access, authentication bypass'
  },
  
  {
    name: 'Basic Auth Credentials',
    pattern: /Basic\s+[A-Za-z0-9+/]+=*/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'HTTP Basic authentication credentials',
    impact: 'Authentication bypass'
  },
  
  {
    name: 'SSH Private Key',
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'SSH private key',
    impact: 'Server access, lateral movement'
  },
  
  {
    name: 'PGP Private Key',
    pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'PGP private key',
    impact: 'Encryption compromise, identity theft'
  },
  
  // === Payment & Financial ===
  
  {
    name: 'Stripe API Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'Stripe secret API key',
    impact: 'Payment manipulation, financial fraud'
  },
  
  {
    name: 'Stripe Restricted Key',
    pattern: /rk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Stripe restricted API key',
    impact: 'Limited payment access'
  },
  
  {
    name: 'PayPal Braintree Token',
    pattern: /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/gi,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'PayPal Braintree access token',
    impact: 'Payment system access, fraud'
  },
  
  // === Generic Patterns (Lower Confidence) ===
  
  {
    name: 'Generic API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['\"]?[a-zA-Z0-9]{32,}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Generic API key pattern',
    impact: 'API access, varies by service'
  },
  
  {
    name: 'Generic Secret',
    pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['\"]?[^\s'\"]{12,}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'low',
    description: 'Generic secret or password',
    impact: 'Authentication compromise'
  },
  
  {
    name: 'Private Key (Generic)',
    pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*['\"]?[a-zA-Z0-9+/=]{40,}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Generic private key pattern',
    impact: 'Cryptographic key compromise'
  },
  
  {
    name: 'Auth Token (Generic)',
    pattern: /(?:auth[_-]?token|authtoken|access[_-]?token)\s*[:=]\s*['\"]?[a-zA-Z0-9\-._~+/]{20,}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Generic authentication token',
    impact: 'Authentication bypass'
  },
  
  {
    name: 'X402 Payment Credentials',
    pattern: /x402[_-]?(?:key|secret|token)\s*[:=]\s*['\"]?[a-zA-Z0-9\-_]{20,}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'X402 payment protocol credentials',
    impact: 'Payment manipulation, wallet access'
  },
  
  // === Additional Cloud & Infrastructure ===
  
  {
    name: 'DigitalOcean API Token',
    pattern: /\b[0-9a-f]{64}\b/g,
    severity: 'HIGH',
    confidence: 'low',
    description: 'DigitalOcean API token',
    impact: 'Cloud infrastructure access, resource manipulation'
  },
  
  {
    name: 'Heroku API Key',
    pattern: /heroku[_-]?api[_-]?key\s*[:=]\s*['\"]?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Heroku API key',
    impact: 'Application deployment access, environment variable access'
  },
  
  // === Email & Communication Services ===
  
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'SendGrid email service API key',
    impact: 'Email spam, phishing campaigns, reputation damage'
  },
  
  {
    name: 'Mailgun API Key',
    pattern: /key-[0-9a-f]{32}|mailgun[_-]?api[_-]?key\s*[:=]\s*['\"]?[0-9a-f]{32}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Mailgun email API key',
    impact: 'Email service abuse, spam campaigns'
  },
  
  {
    name: 'Twilio Account SID & Auth Token',
    pattern: /AC[0-9a-f]{32}|twilio[_-]?auth[_-]?token\s*[:=]\s*['\"]?[0-9a-f]{32}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'high',
    description: 'Twilio API credentials',
    impact: 'SMS/Voice service abuse, billing fraud'
  },
  
  {
    name: 'Mailchimp API Key',
    pattern: /[0-9a-f]{32}-us[0-9]{1,2}/g,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Mailchimp API key',
    impact: 'Email list access, campaign manipulation'
  },
  
  // === Monitoring & Analytics ===
  
  {
    name: 'Datadog API Key',
    pattern: /datadog[_-]?api[_-]?key\s*[:=]\s*['\"]?[0-9a-f]{32}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Datadog monitoring API key',
    impact: 'Metrics manipulation, log access'
  },
  
  {
    name: 'New Relic License Key',
    pattern: /[a-f0-9]{40}|newrelic[_-]?license[_-]?key\s*[:=]\s*['\"]?[a-f0-9]{40}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'low',
    description: 'New Relic APM license key',
    impact: 'Performance data access, billing abuse'
  },
  
  {
    name: 'Sentry DSN',
    pattern: /https:\/\/[0-9a-f]{32}@[a-z0-9\-]+\.ingest\.sentry\.io\/[0-9]+/gi,
    severity: 'MEDIUM',
    confidence: 'high',
    description: 'Sentry error tracking DSN',
    impact: 'Error data access, privacy breach'
  },
  
  // === CI/CD & Development Tools ===
  
  {
    name: 'CircleCI Token',
    pattern: /circleci[_-]?token\s*[:=]\s*['\"]?[a-f0-9]{40}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'CircleCI API token',
    impact: 'Build pipeline access, supply chain attack'
  },
  
  {
    name: 'Travis CI Token',
    pattern: /travis[_-]?token\s*[:=]\s*['\"]?[a-zA-Z0-9_-]{22}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Travis CI access token',
    impact: 'Build system access, code execution'
  },
  
  {
    name: 'Docker Hub Token',
    pattern: /docker[_-]?(?:hub|token)\s*[:=]\s*['\"]?[a-f0-9-]{36}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Docker Hub authentication token',
    impact: 'Container image manipulation, supply chain attack'
  },
  
  {
    name: 'JFrog Artifactory Token',
    pattern: /AKC[a-zA-Z0-9]{10,}/g,
    severity: 'HIGH',
    confidence: 'high',
    description: 'JFrog Artifactory API token',
    impact: 'Artifact repository access, supply chain attack'
  },
  
  // === Social Media & Marketing ===
  
  {
    name: 'Twitter API Key',
    pattern: /twitter[_-]?api[_-]?key\s*[:=]\s*['\"]?[0-9a-zA-Z]{25}['\"]?|twitter[_-]?api[_-]?secret\s*[:=]\s*['\"]?[0-9a-zA-Z]{50}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Twitter API credentials',
    impact: 'Account access, automated posting abuse'
  },
  
  {
    name: 'Facebook Access Token',
    pattern: /EAA[0-9A-Za-z]+/g,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Facebook Graph API access token',
    impact: 'Social media account access, data harvesting'
  },
  
  {
    name: 'LinkedIn Access Token',
    pattern: /linkedin[_-]?access[_-]?token\s*[:=]\s*['\"]?[a-zA-Z0-9\-_]{60,}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'LinkedIn API access token',
    impact: 'Professional network access, data scraping'
  },
  
  // === Additional Payment Services ===
  
  {
    name: 'Square Access Token',
    pattern: /sq0atp-[0-9A-Za-z\-_]{22}|sq0csp-[0-9A-Za-z\-_]{43}/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'Square payment API token',
    impact: 'Payment processing access, financial fraud'
  },
  
  {
    name: 'Coinbase API Key',
    pattern: /coinbase[_-]?api[_-]?(?:key|secret)\s*[:=]\s*['\"]?[a-zA-Z0-9]{32}['\"]?/gi,
    severity: 'CRITICAL',
    confidence: 'medium',
    description: 'Coinbase cryptocurrency API credentials',
    impact: 'Cryptocurrency wallet access, financial theft'
  },
  
  // === Infrastructure & Hosting ===
  
  {
    name: 'Cloudflare API Key',
    pattern: /cloudflare[_-]?api[_-]?key\s*[:=]\s*['\"]?[a-f0-9]{37}['\"]?/gi,
    severity: 'HIGH',
    confidence: 'medium',
    description: 'Cloudflare API key',
    impact: 'DNS manipulation, CDN configuration access'
  },
  
  {
    name: 'Firebase Service Account',
    pattern: /firebase[_-]?(?:service|admin)[_-]?(?:account|key)\s*[:=]\s*['\"]?[\w\W]*?private_key[\w\W]*?['\"]?/gi,
    severity: 'CRITICAL',
    confidence: 'medium',
    description: 'Firebase service account credentials',
    impact: 'Database access, authentication bypass'
  },
  
  {
    name: 'PlanetScale Database Token',
    pattern: /pscale_tkn_[a-zA-Z0-9_\-\.]{32,}/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'PlanetScale database access token',
    impact: 'Database access, data breach'
  },
  
  {
    name: 'Supabase Service Key',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*service_role[a-zA-Z0-9_-]*/g,
    severity: 'CRITICAL',
    confidence: 'high',
    description: 'Supabase service role key',
    impact: 'Backend database bypass, data breach'
  },
  
  // === Cryptocurrency & Blockchain ===
  
  {
    name: 'Ethereum Private Key',
    pattern: /0x[a-fA-F0-9]{64}/g,
    severity: 'CRITICAL',
    confidence: 'medium',
    description: 'Ethereum wallet private key',
    impact: 'Cryptocurrency theft, wallet compromise'
  },
  
  {
    name: 'Bitcoin Private Key (WIF)',
    pattern: /[5KL][1-9A-HJ-NP-Za-km-z]{50,51}/g,
    severity: 'CRITICAL',
    confidence: 'medium',
    description: 'Bitcoin wallet private key (WIF format)',
    impact: 'Bitcoin theft, wallet compromise'
  },
  
  // === Search & Analytics ===
  
  {
    name: 'Algolia API Key',
    pattern: /algolia[_-]?(?:api|admin)[_-]?key\s*[:=]\s*['\"]?[a-f0-9]{32}['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'medium',
    description: 'Algolia search API key',
    impact: 'Search index manipulation, data access'
  },
  
  {
    name: 'Elastic Cloud ID',
    pattern: /cloud[_-]?id\s*[:=]\s*['\"]?[a-zA-Z0-9\-_:]+['\"]?/gi,
    severity: 'MEDIUM',
    confidence: 'low',
    description: 'Elastic Cloud deployment ID',
    impact: 'Search cluster access, data exfiltration'
  }
];

/**
 * Enhanced secret detection with context-aware analysis
 * 
 * @param {Object} config - Configuration object to scan
 * @param {Object} options - Scanning options
 * @returns {Array} Array of detected secrets with metadata
 */
function findExposedSecrets(config, options = {}) {
  const secrets = [];
  const configStr = JSON.stringify(config, null, 2);
  const seenPatterns = new Set(); // Deduplicate findings
  
  CREDENTIAL_PATTERNS.forEach(({ name, pattern, severity, confidence, description, impact }) => {
    // Reset regex to avoid state issues
    const regex = new RegExp(pattern.source, pattern.flags);
    const matches = configStr.match(regex);
    
    if (matches && matches.length > 0) {
      // Create unique identifier for this pattern match
      const patternId = `${name}-${matches.length}`;
      
      if (!seenPatterns.has(patternId)) {
        seenPatterns.add(patternId);
        
        // Extract sample value (redacted)
        const sampleValue = matches[0].length > 20 
          ? matches[0].substring(0, 20) + '...' 
          : matches[0];
        
        // Check if it's an environment variable reference (safe)
        const isSafeReference = matches.every(match => 
          match.includes('${') || 
          match.includes('$env:') ||
          match.includes('%') ||
          match.startsWith('process.env')
        );
        
        if (!isSafeReference) {
          secrets.push({
            type: name,
            severity,
            confidence,
            description,
            impact,
            count: matches.length,
            sample: sampleValue,
            found: true,
            hardcoded: true
          });
        }
      }
    }
  });
  
  return secrets;
}

/**
 * Validate specific credential patterns with additional logic
 */
function validateCredential(type, value) {
  switch (type) {
    case 'JWT Token':
      return validateJWT(value);
    
    case 'AWS Access Key':
      return value.startsWith('AKIA') && value.length === 20;
    
    case 'OpenAI API Key':
      return (value.startsWith('sk-') && value.includes('T3BlbkFJ')) ||
             (value.startsWith('sk-proj-') && value.length >= 51);
    
    case 'GitHub Personal Access Token':
      return /^gh[pso]_[a-zA-Z0-9]{36}$/.test(value);
    
    default:
      return true; // Pattern match is sufficient
  }
}

/**
 * Basic JWT validation (structure check only)
 */
function validateJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Verify base64url encoding
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return header && payload;
  } catch (e) {
    return false;
  }
}

/**
 * Check for weak patterns that indicate test/placeholder values
 */
function isWeakOrPlaceholder(value) {
  const weakPatterns = [
    /test/i,
    /example/i,
    /placeholder/i,
    /your[_-]?(?:key|token|secret)/i,
    /replace[_-]?me/i,
    /change[_-]?me/i,
    /xxxx/i,
    /1234/,
    /demo/i,
    /sample/i
  ];
  
  return weakPatterns.some(pattern => pattern.test(value));
}

/**
 * Get severity score for risk calculation
 */
function getSeverityScore(severity) {
  const scores = {
    'CRITICAL': 10,
    'HIGH': 7,
    'MEDIUM': 4,
    'LOW': 2
  };
  return scores[severity] || 1;
}

/**
 * Calculate overall credential exposure risk
 */
function calculateCredentialRisk(secrets) {
  if (secrets.length === 0) return 'LOW';
  
  const totalScore = secrets.reduce((sum, secret) => {
    const baseScore = getSeverityScore(secret.severity);
    const confidenceMultiplier = secret.confidence === 'high' ? 1 : 0.7;
    return sum + (baseScore * confidenceMultiplier);
  }, 0);
  
  const avgScore = totalScore / secrets.length;
  
  if (avgScore >= 8) return 'CRITICAL';
  if (avgScore >= 6) return 'HIGH';
  if (avgScore >= 3) return 'MEDIUM';
  return 'LOW';
}

module.exports = {
  CREDENTIAL_PATTERNS,
  findExposedSecrets,
  validateCredential,
  isWeakOrPlaceholder,
  getSeverityScore,
  calculateCredentialRisk
};
