# API Usage Examples

## Order & Documentation Agent

### Start New Order
**Note:** No authentication required - anyone can create an order directly. Phone number is required to identify and continue chats.

```bash
POST /api/orders
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "initialMessage": "I need a web application for my e-commerce business. It should have user authentication, product catalog, shopping cart, and payment integration."
}
```

**Note:** If an active chat already exists for this phone number, it will continue that conversation instead of creating a new one.

Optional: You can include `clientId` if you have one, but it's not required:
```bash
POST /api/orders
Content-Type: application/json

{
  "phoneNumber": "+919876543210",
  "clientId": "507f1f77bcf86cd799439011",
  "initialMessage": "I need a web application for my e-commerce business. It should have user authentication, product catalog, shopping cart, and payment integration."
}
```

### Get Chat by Phone Number
Check if there's an existing active chat for a phone number:

```bash
GET /api/orders/phone/+919876543210
```

### Continue Conversation
```bash
POST /api/orders/:projectId/message
Content-Type: application/json

{
  "message": "I want to use React for the frontend and Node.js for the backend. Budget is around ₹5 lakhs."
}
```

### Generate Documentation
```bash
POST /api/orders/:projectId/generate-documentation
```

## Lead Generation Agent

### Analyze Profile
```bash
POST /api/leads/analyze
Content-Type: application/json

{
  "profileUrl": "https://www.linkedin.com/in/example",
  "platform": "linkedin"
}
```

### Generate Personalized Message
```bash
POST /api/leads/:leadId/generate-message
Content-Type: application/json

{
  "messageType": "email"
}
```

### Send Email
```bash
POST /api/leads/:leadId/send-email
```

### Qualify Lead
```bash
POST /api/leads/:leadId/qualify
```

## Email Automation

### Schedule Email Sequence
```bash
POST /api/emails/schedule-sequence
Content-Type: application/json

{
  "leadId": "507f1f77bcf86cd799439011",
  "sequenceType": "warm_lead"
}
```

### Track Email Engagement (Webhook)
```bash
POST /api/emails/track/:emailId
Content-Type: application/json

{
  "event": "open",
  "data": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Voice Calling

### Initiate Call
```bash
POST /api/calls/initiate
Content-Type: application/json

{
  "leadId": "507f1f77bcf86cd799439011",
  "phoneNumber": "+919876543210"
}
```

### WebSocket Connection (Voice)
```javascript
const socket = io('http://localhost:3000');

// Initiate call
socket.emit('call:initiate', {
  leadId: '507f1f77bcf86cd799439011',
  phoneNumber: '+919876543210'
});

// Send audio stream
socket.emit('call:audio', {
  callId: 'call_id_here',
  audioChunk: audioBuffer
});

// Listen for responses
socket.on('call:response', (data) => {
  console.log('Response:', data.text);
  // Play audioResponse
});

// End call
socket.emit('call:end', {
  callId: 'call_id_here'
});
```

## Social Media Agent

### Generate Content
```bash
POST /api/social/generate-content
Content-Type: application/json

{
  "topic": "Benefits of custom web development",
  "platform": "linkedin",
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

### Schedule Post
```bash
POST /api/social/schedule-post
Content-Type: application/json

{
  "content": "Your generated content here...",
  "platform": "linkedin",
  "scheduledTime": "2024-01-15T10:00:00Z"
}
```

### Discover Leads
```bash
POST /api/social/discover-leads
Content-Type: application/json

{
  "clientIds": ["507f1f77bcf86cd799439011"]
}
```

## HR & Meeting Agent

### Ingest Knowledge
```bash
POST /api/hr/knowledge
Content-Type: application/json

{
  "content": "Our company offers web development services. We specialize in React, Node.js, and MongoDB. Our pricing starts at ₹50,000 for basic websites and goes up to ₹10 lakhs for enterprise applications.",
  "metadata": {
    "title": "Service Offerings",
    "category": "service",
    "tags": ["services", "pricing", "tech-stack"]
  }
}
```

### Ask Question
```bash
POST /api/hr/ask
Content-Type: application/json

{
  "question": "What is our pricing for web development?",
  "context": {}
}
```

### Schedule Meeting
```bash
POST /api/hr/schedule-meeting
Content-Type: application/json

{
  "participants": ["client@example.com", "team@example.com"],
  "title": "Project Kickoff Meeting",
  "description": "Discuss project requirements and timeline",
  "preferredTimes": [
    "2024-01-15T10:00:00Z",
    "2024-01-15T14:00:00Z"
  ]
}
```

### Generate Meeting Notes
```bash
POST /api/hr/generate-notes
Content-Type: application/json

{
  "transcript": "Meeting transcript here...",
  "participants": ["John Doe", "Jane Smith"]
}
```

## Client Management

### Create Client
```bash
POST /api/clients
Content-Type: application/json

{
  "companyInfo": {
    "name": "Example Corp",
    "industry": "Technology",
    "size": "50-100",
    "website": "https://example.com"
  },
  "contactDetails": {
    "primaryContact": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+919876543210",
      "role": "CEO"
    }
  },
  "socialProfiles": [
    {
      "platform": "linkedin",
      "url": "https://linkedin.com/company/example"
    }
  ]
}
```

### Add Social Profile
```bash
POST /api/clients/:clientId/social-profiles
Content-Type: application/json

{
  "platform": "twitter",
  "url": "https://twitter.com/example",
  "metadata": {}
}
```

## Complete Workflow Example

### 1. Create Client
```bash
POST /api/clients
# Returns: { "client": { "_id": "client_id", ... } }
```

### 2. Analyze Lead from Client Profile
```bash
POST /api/leads/analyze
{
  "profileUrl": "https://linkedin.com/in/potential-lead",
  "platform": "linkedin"
}
# Returns: { "leadId": "lead_id", "leadScore": 75, ... }
```

### 3. Generate and Send Personalized Email
```bash
POST /api/leads/:leadId/generate-message
POST /api/leads/:leadId/send-email
```

### 4. Schedule Email Sequence
```bash
POST /api/emails/schedule-sequence
{
  "leadId": "lead_id",
  "sequenceType": "warm_lead"
}
```

### 5. Initiate Verification Call
```bash
POST /api/calls/initiate
{
  "leadId": "lead_id",
  "phoneNumber": "+919876543210"
}
```

### 6. Create Project from Qualified Lead
```bash
POST /api/orders
{
  "clientId": "client_id",
  "initialMessage": "Project requirements from call..."
}
```

### 7. Generate Documentation
```bash
POST /api/orders/:projectId/generate-documentation
```

## Error Handling

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

Default rate limit: 100 requests per 15 minutes per IP.

Headers returned:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

