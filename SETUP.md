# Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp env.example .env
```

Edit `.env` and configure:
- MongoDB connection string
- Redis connection details
- Sarvam AI API key (required)
- Gemini API key (optional, for fallback)
- SMTP credentials for email
- JWT secret

### 3. Start Services

**MongoDB:**
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

**Redis:**
```bash
# Local Redis
redis-server

# Or use Redis Cloud
# Update REDIS_HOST and REDIS_PORT in .env
```

### 4. Initialize Logs Directory
The logs directory will be created automatically on first run.

### 5. Run the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**With PM2:**
```bash
npm run pm2:start
```

### 6. Verify Installation

Check health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "ai-manager-multi-agent"
}
```

## Testing Agents

### Test Order Agent
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_id_here",
    "initialMessage": "I need a web application for my business"
  }'
```

### Test Lead Analysis
```bash
curl -X POST http://localhost:3000/api/leads/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "profileUrl": "https://linkedin.com/in/example",
    "platform": "linkedin"
  }'
```

### Test HR Knowledge Base
```bash
curl -X POST http://localhost:3000/api/hr/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Our company offers web development services starting at ₹50,000 for basic websites.",
    "metadata": {
      "title": "Service Pricing",
      "category": "pricing"
    }
  }'
```

## Common Issues

### MongoDB Connection Error
- Verify MongoDB is running
- Check MONGODB_URI in .env
- Ensure network access if using cloud MongoDB

### Redis Connection Error
- Verify Redis is running
- Check REDIS_HOST and REDIS_PORT
- Test connection: `redis-cli ping`

### Sarvam AI API Error
- Verify SARVAM_API_KEY is set
- Check API key validity
- Ensure network access to Sarvam API

### Puppeteer/Playwright Issues
- Install system dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2
  ```

## Next Steps

1. Create your first client
2. Add social profiles
3. Start analyzing leads
4. Set up email sequences
5. Configure knowledge base
6. Test voice calling (requires telephony setup)

