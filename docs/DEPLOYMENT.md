# ClawSec Deployment Guide

Deploy ClawSec server to production environments.

## Deployment Options

### Option 1: VPS / Cloud Server (Recommended)

**Requirements**:
- Linux server (Ubuntu 22.04+ recommended)
- Node.js 18+ installed
- 512MB RAM minimum (1GB recommended)
- Port 4021 open (or custom port)

**Steps**:

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://github.com/ClawSecAI/ClawSec-skill.git
cd ClawSec-skill

# 4. Install dependencies
npm install --production

# 5. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 6. Start with PM2 (process manager)
sudo npm install -g pm2
pm2 start server/index.js --name clawsec
pm2 save
pm2 startup  # Auto-start on reboot

# 7. Check status
pm2 status
pm2 logs clawsec
```

**Nginx Reverse Proxy** (optional, for HTTPS):

```nginx
server {
    listen 80;
    server_name clawsec.yourdomain.com;

    location / {
        proxy_pass http://localhost:4021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Install Certbot for HTTPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d clawsec.yourdomain.com
```

### Option 2: Docker (Coming Soon)

Docker support planned for post-hackathon release.

```dockerfile
# Dockerfile (preview)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4021
CMD ["node", "server/index.js"]
```

### Option 3: Serverless (Future)

Serverless deployment (Vercel, AWS Lambda) planned for future release.

## Environment Configuration

**Production `.env` example**:

```bash
# Server
PORT=4021
NODE_ENV=production

# Payment (enable for production)
ENABLE_PAYMENT=true
WALLET_ADDRESS=0xYourWalletAddressHere
FACILITATOR_URL=https://x402.org/facilitator
NETWORK=base  # Use 'base' for mainnet, 'base-sepolia' for testnet

# LLM (optional - uses mock if empty)
ANTHROPIC_API_KEY=sk-ant-your-key-here
MODEL=claude-sonnet-4-5

# RPC (optional)
BASE_RPC=https://mainnet.base.org
```

## Security Hardening

### 1. Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Only allow 4021 from localhost (if using Nginx)
sudo ufw deny 4021/tcp
```

### 2. Environment Variables

**Never commit `.env` file!**

```bash
# Verify .env is in .gitignore
git check-ignore .env

# Use secrets management for production
# - AWS Secrets Manager
# - HashiCorp Vault
# - Environment variables in hosting platform
```

### 3. HTTPS Only

Always use HTTPS in production:
- Use Nginx + Certbot (Let's Encrypt)
- Use Cloudflare proxy
- Use hosting platform SSL (Heroku, Vercel, etc.)

### 4. Rate Limiting

Add rate limiting to prevent abuse:

```javascript
// server/index.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. API Key Authentication

For production, consider adding API key auth:

```javascript
// server/middleware/auth.js
const API_KEYS = process.env.API_KEYS?.split(',') || [];

function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!API_KEYS.includes(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

module.exports = { requireApiKey };
```

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs clawsec

# Monitor resources
pm2 monit

# View metrics
pm2 describe clawsec
```

### Health Check Monitoring

Use external monitoring service (UptimeRobot, Pingdom, etc.):
- Monitor: `https://your-domain.com/health`
- Check interval: 5 minutes
- Alert on: Status != 200 or `status` != "healthy"

### Log Aggregation

For production, use log aggregation:
- Papertrail
- Loggly
- CloudWatch (AWS)
- Google Cloud Logging

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Scaling

### Horizontal Scaling

Run multiple instances behind load balancer:

```bash
# PM2 cluster mode
pm2 start server/index.js -i max --name clawsec-cluster
```

### Load Balancer

Use Nginx for load balancing:

```nginx
upstream clawsec {
    server localhost:4021;
    server localhost:4022;
    server localhost:4023;
}

server {
    listen 80;
    location / {
        proxy_pass http://clawsec;
    }
}
```

## Backup & Recovery

### Configuration Backup

```bash
# Backup .env
cp .env .env.backup.$(date +%Y%m%d)

# Store in secure location (not in git!)
```

### Database Backup (if added)

```bash
# Example for future MongoDB/PostgreSQL
# mongodump --out /backup/$(date +%Y%m%d)
# pg_dump dbname > /backup/$(date +%Y%m%d).sql
```

## Updates

### Update ClawSec

```bash
# Pull latest changes
cd ClawSec-skill
git pull origin main

# Install dependencies
npm install --production

# Restart server
pm2 restart clawsec

# Check logs
pm2 logs clawsec --lines 50
```

### Zero-Downtime Updates

```bash
# PM2 reload (zero-downtime)
pm2 reload clawsec

# Or use PM2 ecosystem file
pm2 reload ecosystem.config.js --update-env
```

## Troubleshooting

### Server Won't Start

```bash
# Check port availability
sudo lsof -i :4021

# Check permissions
ls -la server/index.js

# Check environment
cat .env

# View detailed logs
pm2 logs clawsec --lines 100 --err
```

### High Memory Usage

```bash
# Check memory
pm2 describe clawsec

# Restart if needed
pm2 restart clawsec

# Monitor
watch -n 1 'pm2 describe clawsec | grep memory'
```

### Can't Connect Externally

```bash
# Check firewall
sudo ufw status

# Check binding
netstat -tlnp | grep 4021

# Test locally
curl http://localhost:4021/health

# Test externally
curl http://your-server-ip:4021/health
```

## Cost Estimates

### VPS Hosting

- **DigitalOcean**: $6/month (1GB droplet)
- **Linode**: $5/month (1GB Nanode)
- **AWS Lightsail**: $5/month (1GB instance)
- **Hetzner**: €3.5/month (~$4/month)

### Additional Costs

- Domain name: ~$10/year
- SSL certificate: Free (Let's Encrypt)
- LLM API (Anthropic): ~$0.01-0.05 per scan
- Monitoring: Free tier available

**Total**: ~$5-10/month + API usage

## Production Checklist

Before going live:

- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] Firewall rules set
- [ ] Monitoring configured
- [ ] Backup strategy implemented
- [ ] Rate limiting enabled
- [ ] Error logging set up
- [ ] Health checks passing
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Documentation updated
- [ ] Team trained on operations

---

**Questions?** Open an issue: https://github.com/ClawSecAI/ClawSec-skill/issues
