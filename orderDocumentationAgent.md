# Order Documentation Agent API Documentation

## Overview

The Order Documentation Agent is a specialized AI agent that handles the complete project order lifecycle from initial requirements capture to comprehensive technical documentation generation. It uses a conversational interface to gather project requirements and employs a multi-agent collaboration pattern to generate detailed development documentation.

**Note:** This API is open to everyone - no authentication or tokens are required. Anyone can directly chat and receive documentation with an estimated plan.

## Base URL

```
http://localhost:3000/api
```

---

## API Endpoints

### 1. Start New Order/Project

Creates a new project order and initiates a conversational interface to capture requirements. If an active chat already exists for the phone number, it will continue that conversation instead of creating a new one.

**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "phoneNumber": "+919876543210",
  "initialMessage": "I need a web application for managing my restaurant orders"
}
```

**Request Body Parameters:**
- `phoneNumber` (string, required): Phone number to identify and continue chats
- `initialMessage` (string, required): Initial message describing the project needs
- `clientId` (string, optional): MongoDB ObjectId of the client (not required - anyone can create an order)

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "initialMessage": "I need a web application for managing my restaurant orders. It should handle online ordering, payment processing, and kitchen display system."
  }'
```

**Success Response (200 OK) - New Chat:**
```json
{
  "projectId": "507f191e810c19729de860ea",
  "response": "That sounds like an exciting project! I'd love to help you build a comprehensive restaurant management system. To get started, could you tell me more about:\n\n1. What technology stack are you most comfortable with, or do you have any preferences?\n2. How many restaurants will be using this system initially?\n3. Do you need mobile apps for customers, or will a web application suffice?\n4. What's your target timeline for launching this system?",
  "isExistingChat": false
}
```

**Success Response (200 OK) - Existing Chat Continued:**
```json
{
  "projectId": "507f191e810c19729de860ea",
  "response": "Welcome back! I see we were discussing your restaurant management system. How can I help you today?",
  "isExistingChat": true
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "phoneNumber is required"
}
```
or
```json
{
  "error": "initialMessage is required"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Order processing error: [error message]"
}
```

---

### 2. Continue Conversation

Sends a message in an ongoing project conversation and receives an AI-generated response.

**Endpoint:** `POST /orders/:projectId/message`

**URL Parameters:**
- `projectId` (string, required): MongoDB ObjectId of the project

**Request Body:**
```json
{
  "message": "I prefer React for the frontend and Node.js for the backend. We have 3 restaurants and need both web and mobile apps."
}
```

**Request Body Parameters:**
- `message` (string, required): User's message in the conversation

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/orders/507f191e810c19729de860ea/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I prefer React for the frontend and Node.js for the backend. We have 3 restaurants and need both web and mobile apps. Budget is around 5 lakhs and we need it in 3 months."
  }'
```

**Success Response (200 OK):**
```json
{
  "response": "Great choices! React and Node.js will give you a modern, scalable stack. For mobile apps, are you thinking React Native to share code with the web app, or native iOS/Android?\n\nWith 3 restaurants and a 3-month timeline, we'll need to prioritize features. What are the must-have features for launch vs. nice-to-haves for later phases?\n\nAlso, regarding the 5 lakh budget - does that include hosting, maintenance, and any third-party services like payment gateways?"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "message is required"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Project not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Message response error: [error message]"
}
```

---

### 3. Generate Documentation

Generates comprehensive technical documentation using a multi-agent collaboration pattern (Reader → Searcher → Writer → Verifier).

**Endpoint:** `POST /orders/:projectId/generate-documentation`

**URL Parameters:**
- `projectId` (string, required): MongoDB ObjectId of the project

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/orders/507f191e810c19729de860ea/generate-documentation \
  -H "Content-Type: application/json"
```

**Success Response (200 OK):**
```json
{
  "documentation": {
    "sections": [
      {
        "section": "overview",
        "content": "This project involves building a comprehensive restaurant management system...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "architecture",
        "content": "The system will follow a microservices architecture with the following components...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "api_endpoints",
        "content": "RESTful API endpoints:\n\nPOST /api/orders - Create new order\nGET /api/orders/:id - Get order details...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "database_schema",
        "content": "Database Schema:\n\nOrders Collection:\n- _id: ObjectId\n- restaurantId: ObjectId\n- items: Array...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "timeline",
        "content": "Implementation Timeline:\n\nPhase 1 (Weeks 1-4): Core ordering system\nPhase 2 (Weeks 5-8): Payment integration...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "tech_stack",
        "content": "Technology Stack:\n\nFrontend: React 18+, TypeScript, Material-UI\nBackend: Node.js, Express.js...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "features",
        "content": "Feature Breakdown:\n\n1. Online Ordering System\n   - Menu browsing\n   - Cart management...",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "section": "budget_estimation",
        "content": "## Budget Estimation\n\n**Total Estimated Budget:** 5,50,000 INR\n\n### Budget Breakdown\n\n| Category | Amount | Percentage | Description |\n|----------|--------|------------|------------|\n| Development | 3,50,000 INR | 63.6% | Frontend, backend, and mobile app development |\n| Design | 50,000 INR | 9.1% | UI/UX design and branding |\n| Testing | 40,000 INR | 7.3% | QA and testing |\n| DevOps | 30,000 INR | 5.5% | Deployment and infrastructure |\n| Third-party Services | 30,000 INR | 5.5% | Payment gateways, hosting, APIs |\n| Contingency | 50,000 INR | 9.1% | Buffer for unexpected requirements |\n\n### Phase-wise Budget\n\n**Phase 1: Core Ordering System**\n- Budget: 2,00,000 INR\n- Duration: 4 weeks\n- Description: Basic ordering functionality\n\n**Phase 2: Payment Integration**\n- Budget: 1,50,000 INR\n- Duration: 3 weeks\n- Description: Payment gateway integration\n\n**Phase 3: Kitchen Display System**\n- Budget: 1,50,000 INR\n- Duration: 3 weeks\n- Description: KDS implementation\n\n**Phase 4: Mobile Apps**\n- Budget: 50,000 INR\n- Duration: 2 weeks\n- Description: React Native mobile applications\n\n### Assumptions\n\n1. Team of 3 developers (1 frontend, 1 backend, 1 full-stack)\n2. Standard development rates\n3. Basic hosting and infrastructure costs\n4. Standard payment gateway fees\n5. Timeline of 12 weeks total",
        "generatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "fullDocument": "# overview\n\nThis project involves building a comprehensive restaurant management system...\n\n---\n\n# architecture\n\nThe system will follow a microservices architecture...\n\n---\n\n# api_endpoints\n\nRESTful API endpoints...\n\n---\n\n# database_schema\n\nDatabase Schema...\n\n---\n\n# timeline\n\nImplementation Timeline...\n\n---\n\n# tech_stack\n\nTechnology Stack...\n\n---\n\n# features\n\nFeature Breakdown...",
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "version": 1
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Project not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Documentation generation error: [error message]"
}
```

**Note:** This endpoint triggers a multi-agent workflow:
1. **Reader Agent**: Analyzes project requirements and extracts key information
2. **Searcher Agent**: Finds relevant technical patterns and best practices
3. **Budget Estimation Agent**: Estimates project budget based on requirements, complexity, and timeline
4. **Writer Agent**: Generates comprehensive documentation sections including budget estimation
5. **Verifier Agent**: Validates completeness and quality

---

### 4. Get Project Details

Retrieves detailed information about a specific project including conversation history and documentation.

**Endpoint:** `GET /orders/:projectId`

**URL Parameters:**
- `projectId` (string, required): MongoDB ObjectId of the project

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/orders/507f191e810c19729de860ea
```

**Success Response (200 OK):**
```json
{
  "project": {
    "_id": "507f191e810c19729de860ea",
    "clientId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Restaurant Group Inc.",
      "email": "contact@restaurantgroup.com"
    },
    "title": "New Project",
    "description": "Restaurant management system",
    "requirements": [
      {
        "category": "features",
        "description": "Online ordering system",
        "priority": "high"
      },
      {
        "category": "tech_stack",
        "description": "React frontend, Node.js backend",
        "priority": "medium"
      }
    ],
    "techStack": ["React", "Node.js", "MongoDB"],
    "features": ["Online Ordering", "Payment Processing", "Kitchen Display"],
    "timeline": {
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-04-20T00:00:00.000Z",
      "milestones": []
    },
    "budget": {
      "amount": 500000,
      "currency": "INR"
    },
    "documentation": {
      "sections": [...],
      "fullDocument": "...",
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "version": 1
    },
    "status": "documentation",
    "conversationHistory": [
      {
        "role": "user",
        "content": "I need a web application for managing my restaurant orders",
        "timestamp": "2024-01-15T09:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "That sounds like an exciting project!...",
        "timestamp": "2024-01-15T09:00:05.000Z"
      }
    ],
    "assignedTeam": [],
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Project not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "[error message]"
}
```

---

### 5. Get Chat by Phone Number

Retrieves the most recent active chat for a given phone number. Useful for frontend to check if there's an existing conversation before starting a new one.

**Endpoint:** `GET /orders/phone/:phoneNumber`

**URL Parameters:**
- `phoneNumber` (string, required): Phone number to look up (e.g., "+919876543210")

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/orders/phone/%2B919876543210
```

**Success Response (200 OK):**
```json
{
  "project": {
    "_id": "507f191e810c19729de860ea",
    "phoneNumber": "+919876543210",
    "title": "New Project",
    "status": "requirements_capture",
    "conversationHistory": [
      {
        "role": "user",
        "content": "I need a web application for managing my restaurant orders",
        "timestamp": "2024-01-15T09:00:00.000Z"
      },
      {
        "role": "assistant",
        "content": "That sounds like an exciting project!...",
        "timestamp": "2024-01-15T09:00:05.000Z"
      }
    ],
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:05.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "No active chat found for this phone number"
}
```

**Note:** This endpoint only returns chats with status `draft` or `requirements_capture`. Completed or cancelled projects are not returned.

---

### 6. List All Projects

Retrieves a list of all projects with optional filtering by client, phone number, or status.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `clientId` (string, optional): Filter projects by client ID
- `phoneNumber` (string, optional): Filter projects by phone number
- `status` (string, optional): Filter projects by status
  - Possible values: `draft`, `requirements_capture`, `documentation`, `approved`, `in_progress`, `completed`, `cancelled`

**Example Request (All Projects):**
```bash
curl -X GET http://localhost:3000/api/orders
```

**Example Request (Filtered by Client):**
```bash
curl -X GET "http://localhost:3000/api/orders?clientId=507f1f77bcf86cd799439011"
```

**Example Request (Filtered by Status):**
```bash
curl -X GET "http://localhost:3000/api/orders?status=documentation"
```

**Example Request (Multiple Filters):**
```bash
curl -X GET "http://localhost:3000/api/orders?clientId=507f1f77bcf86cd799439011&status=in_progress"
```

**Success Response (200 OK):**
```json
{
  "projects": [
    {
      "_id": "507f191e810c19729de860ea",
      "clientId": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Restaurant Group Inc.",
        "email": "contact@restaurantgroup.com"
      },
      "title": "Restaurant Management System",
      "status": "documentation",
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f191e810c19729de860eb",
      "clientId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "E-commerce Solutions Ltd.",
        "email": "info@ecomsolutions.com"
      },
      "title": "E-commerce Platform",
      "status": "in_progress",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-14T15:20:00.000Z"
    }
  ]
}
```

**Note:** Results are limited to 50 projects and sorted by creation date (newest first).

**Error Response (500 Internal Server Error):**
```json
{
  "error": "[error message]"
}
```

---

## Agent Methods (Internal)

The Order Documentation Agent implements several internal methods that power the API endpoints:

### `processOrder(clientId, phoneNumber, initialMessage)`
- Creates a new project and initiates conversation
- `phoneNumber` is required to identify and continue chats
- `clientId` is optional
- Called by: `POST /orders`

### `respondToMessage(projectId, message)`
- Processes user messages and generates AI responses
- Maintains conversation history
- Called by: `POST /orders/:projectId/message`

### `generateDocumentation(projectId)`
- Orchestrates multi-agent documentation generation including budget estimation
- Called by: `POST /orders/:projectId/generate-documentation`

### `captureRequirements(clientId, conversationHistory)`
- Extracts structured requirements from conversation
- Uses LLM to analyze and structure project requirements

### Multi-Agent Methods:

#### `readerAgent(project)`
- Analyzes project requirements
- Extracts: core objectives, technical complexity, dependencies, risks, resource requirements

#### `searcherAgent(project, readerAnalysis)`
- Finds relevant technical patterns and best practices
- Suggests: architectural patterns, API design patterns, database schemas, security considerations, scalability approaches

#### `budgetEstimationAgent(project, readerAnalysis)`
- Estimates project budget based on requirements and complexity
- Considers: development complexity, features, tech stack, timeline, team size, third-party services
- Returns: total budget, category breakdown, phase-wise costs, assumptions

#### `writerAgent(project, readerAnalysis, searcherPatterns, budgetEstimate)`
- Generates comprehensive documentation sections
- Creates: overview, architecture, API endpoints, database schema, timeline, tech stack, features, budget estimation

#### `verifierAgent(project, documentation)`
- Validates documentation completeness and quality
- Checks: completeness, technical accuracy, consistency, missing information

#### `formatBudgetEstimate(budgetEstimate)`
- Formats budget estimation data into readable markdown
- Creates tables and structured format for budget breakdown

---

## Multi-Agent Workflow

The documentation generation follows a sophisticated multi-agent collaboration pattern:

```
┌─────────────────┐
│  Project Data   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Reader Agent   │ → Analyzes requirements, extracts key info
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Searcher Agent  │ → Finds patterns and best practices
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│ Budget Estimation    │ → Estimates budget with breakdown
│ Agent                │
└────────┬─────────────┘
         │
         ▼
┌─────────────────┐
│  Writer Agent   │ → Generates documentation sections
│                 │   (including budget estimation)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verifier Agent  │ → Validates completeness and quality
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Documentation  │
│  + Budget Est.  │
└─────────────────┘
```

---

## Project Status Flow

```
draft → requirements_capture → documentation → approved → in_progress → completed
                                                                    ↓
                                                               cancelled
```

---

## Error Handling

All endpoints use standard HTTP status codes:
- `200 OK`: Successful request
- `400 Bad Request`: Missing or invalid parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

---

## Notes

1. **Conversation History**: All messages in a project conversation are stored and used to maintain context for subsequent interactions.

2. **Documentation Versioning**: Each time documentation is generated, the version number increments, allowing tracking of documentation changes.

3. **Budget Estimation**: The agent automatically estimates project budget based on:
   - Development complexity (frontend, backend, mobile apps)
   - Number and complexity of features
   - Tech stack requirements
   - Timeline constraints
   - Team size needed
   - Third-party services
   - Testing, DevOps, and deployment costs
   - Includes detailed breakdown by category and phase-wise costs
   - Total estimated budget in INR
   - Category-wise breakdown (Development, Design, Testing, DevOps, Third-party services, Contingency)
   - Phase-wise or milestone-based costs
   - Assumptions and notes for transparency

4. **LLM Integration**: The agent uses Sarvam AI (primary) with Google Gemini as fallback for all LLM operations.

5. **Caching**: LLM responses are cached in Redis for 1 hour to optimize costs and performance.

6. **Project Status**: Projects automatically transition from `requirements_capture` to `documentation` when documentation is generated.

---

## Example Workflow

1. **Start Order**: `POST /orders` with client ID and initial message
2. **Continue Conversation**: `POST /orders/:projectId/message` multiple times to gather requirements
3. **Generate Documentation**: `POST /orders/:projectId/generate-documentation` to create technical docs
4. **Review Project**: `GET /orders/:projectId` to view complete project details
5. **List Projects**: `GET /orders` to see all projects or filter by client/status

