# AI Manager - Multi-Agent System

A comprehensive AI-powered freelancing agency management system with specialized agents for order processing, lead generation, documentation, voice calling, social media management, and HR coordination.

## 🏗️ System Architecture

### Multi-Agent System
- **Order & Documentation Agent**: Captures requirements and generates comprehensive dev documentation
- **Lead Generation & Personalization Agent**: Scrapes profiles, analyzes leads, and creates personalized outreach
- **Email Automation Agent**: Manages email sequences with personalized content
- **Voice Calling Agent**: Automated verification calls with STT/TTS
- **Social Media Agent**: Content generation, posting, and lead discovery
- **HR & Meeting Agent**: Knowledge base management and meeting coordination with RAG

### Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB (client profiles, leads, projects, calls, knowledge base)
- **Cache/Queue**: Redis with BullMQ
- **LLM**: Sarvam AI (primary) + Google Gemini (fallback)
- **Scraping**: Puppeteer for LinkedIn/Twitter
- **Email**: Nodemailer with SMTP
- **Voice**: Sarvam STT/TTS with WebSocket streaming
- **Process Management**: PM2

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- Redis (local or cloud)
- Sarvam AI API key
- Google Gemini API key (optional, for fallback)
- SMTP credentials for email

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/ai-manager

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Sarvam AI
SARVAM_API_KEY=your_key_here
SARVAM_BASE_URL=https://api.sarvam.ai

# Google Gemini (Fallback)
GEMINI_API_KEY=your_key_here

# JWT Secret
JWT_SECRET=your_secret_key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

3. **Start MongoDB and Redis:**
```bash
# MongoDB (if local)
mongod

# Redis (if local)
redis-server
```

4. **Run the server:**
```bash
# Development
npm run dev

# Production
npm start

# With PM2
npm run pm2:start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Orders & Documentation
```
POST   /api/orders                          # Start new order
POST   /api/orders/:projectId/message       # Continue conversation
POST   /api/orders/:projectId/generate-documentation  # Generate docs
GET    /api/orders/:projectId                # Get project
GET    /api/orders                           # List projects
```

### Lead Generation
```
POST   /api/leads/analyze                    # Analyze profile
POST   /api/leads/:leadId/generate-message   # Generate message
POST   /api/leads/:leadId/send-email         # Send email
POST   /api/leads/:leadId/qualify            # Qualify lead
POST   /api/leads/discover                    # Discover from profiles
GET    /api/leads/:leadId                     # Get lead
GET    /api/leads                             # List leads
```

### Email Automation
```
POST   /api/emails/schedule-sequence         # Schedule sequence
POST   /api/emails/track/:emailId             # Track engagement
GET    /api/emails/queue-stats                # Queue statistics
```

### Voice Calling
```
POST   /api/calls/initiate                   # Start call
GET    /api/calls/:callId/status             # Get status
POST   /api/calls/:callId/end                 # End call
GET    /api/calls/:callId                     # Get call details
GET    /api/calls                             # List calls
```

### Social Media
```
POST   /api/social/generate-content           # Generate content
POST   /api/social/schedule-post              # Schedule post
POST   /api/social/monitor-engagement         # Monitor engagement
POST   /api/social/discover-leads             # Discover leads
POST   /api/social/respond-comment            # Generate response
```

### HR & Meetings
```
POST   /api/hr/knowledge                      # Ingest knowledge
POST   /api/hr/ask                            # Ask question
POST   /api/hr/schedule-meeting               # Schedule meeting
POST   /api/hr/generate-notes                 # Generate notes
POST   /api/hr/follow-up                      # Follow up
GET    /api/hr/knowledge                      # List knowledge
```

### Clients
```
POST   /api/clients                           # Create client
GET    /api/clients/:clientId                 # Get client
PUT    /api/clients/:clientId                 # Update client
GET    /api/clients                           # List clients
POST   /api/clients/:clientId/social-profiles # Add profile
```

## 🔌 WebSocket Events

### Voice Calling
- `call:initiate` - Initiate a call
- `call:audio` - Send audio stream
- `call:end` - End call
- `call:initiated` - Call initiated response
- `call:response` - Audio/text response
- `call:ended` - Call ended
- `call:error` - Error occurred

## 🗄️ Database Schema

### Clients
- Company info, contact details, social profiles, project history, lead score

### Leads
- Profile URL, platform, profile data, lead score, contact status, conversation history, personalization data

### Projects
- Client reference, requirements, tech stack, features, timeline, budget, documentation, status

### Calls
- Lead/client reference, phone number, transcript, verification data, recording URL, duration

### KnowledgeBase
- Content chunks, embeddings, metadata (category, tags, version)

## 💰 Cost Optimization

### Sarvam AI Pricing
- **Chat Completion**: ₹0/token (FREE) - Use for high-volume tasks
- **STT (Speech-to-Text)**: ₹30/hour - Bill per second
- **TTS (Text-to-Speech)**: ₹15/10K characters

### Optimization Tips
1. Use Sarvam for documentation generation and personalization (free)
2. Implement response caching (1-hour TTL)
3. Batch process social profile analysis
4. Use Gemini only as fallback for complex reasoning
5. Monitor token usage with daily/weekly limits

## 🔒 Security

- API key management and rotation
- Encrypted client data storage
- Rate limiting on all endpoints
- GDPR compliance for data collection
- Audit logs for all agent actions
- JWT authentication (optional)

## 📊 Monitoring

- Agent performance metrics (response time, success rate)
- LLM API usage and costs
- Queue statistics
- Error logging with Winston
- PM2 process management

## 🚢 Deployment

### With PM2
```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up Redis cluster if needed
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates
6. Configure firewall rules

### Recommended Infrastructure
- **AWS/DigitalOcean**: VPS with 2GB+ RAM
- **MongoDB Atlas**: Managed MongoDB
- **Redis Cloud**: Managed Redis
- **Nginx**: Reverse proxy
- **PM2**: Process management

## 🧪 Development

### Project Structure
```
src/
├── agents/              # Agent modules
│   ├── orderDocumentationAgent.js
│   ├── leadGenerationAgent.js
│   ├── emailAutomationAgent.js
│   ├── voiceCallingAgent.js
│   ├── socialMediaAgent.js
│   └── hrMeetingAgent.js
├── services/            # Service layers
│   ├── llm/            # LLM integration
│   ├── scraper/        # Profile scraping
│   └── email/          # Email service
├── models/             # MongoDB models
├── routes/             # API routes
├── middleware/         # Express middleware
├── config/             # Configuration
└── utils/              # Utilities
```

## 📝 Notes

- LinkedIn/Twitter scraping requires proxies and rate limiting in production
- Voice calling requires SIP/WebRTC integration or Exotel for PSTN
- Social media posting requires platform API integrations
- Calendar integration requires Google Calendar/Outlook APIs
- Vector embeddings for RAG can be added for better knowledge retrieval

## 🤝 Contributing

This is a comprehensive system built for production use. Extend agents and services as needed for your specific requirements.

## 📄 License

Private - All Rights Reserved
#   o r d e r _ a i _ a g e n t  
 #   o r d e r _ a i _ a g e n t  
 #   o r d e r _ a i  
 