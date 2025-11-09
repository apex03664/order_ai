import llmService from '../services/llm/llmService.js';
import Project from '../models/Project.js';
import logger from '../utils/logger.js';

class OrderDocumentationAgent {
  constructor() {
    this.name = 'OrderDocumentationAgent';
  }

  async captureRequirements(clientId, conversationHistory) {
    try {
      const systemPrompt = `You are an expert requirements analyst. Analyze the conversation to extract:
1. Tech stack preferences
2. Key features and functionality
3. Timeline expectations
4. Budget range
5. Project scope and complexity

Return a structured JSON with these fields.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: 'Extract and structure the project requirements from this conversation.' }
      ];

      const response = await llmService.chatCompletion(messages, {
        temperature: 0.3,
        max_tokens: 2000
      });

      const requirements = JSON.parse(response.choices[0].message.content);
      return requirements;
    } catch (error) {
      logger.error(`Requirements capture error: ${error.message}`);
      throw error;
    }
  }

  async generateDocumentation(projectId) {
    try {
      const project = await Project.findById(projectId).populate('clientId');
      if (!project) {
        throw new Error('Project not found');
      }

      // Multi-agent collaboration pattern
      const readerResult = await this.readerAgent(project);
      const searcherResult = await this.searcherAgent(project, readerResult);
      const budgetEstimate = await this.budgetEstimationAgent(project, readerResult);
      const writerResult = await this.writerAgent(project, readerResult, searcherResult, budgetEstimate);
      const verifierResult = await this.verifierAgent(project, writerResult);

      // Update project with documentation
      project.documentation = {
        sections: writerResult.sections,
        fullDocument: writerResult.fullDocument,
        generatedAt: new Date(),
        version: (project.documentation?.version || 0) + 1
      };
      project.status = 'documentation';
      await project.save();

      return project.documentation;
    } catch (error) {
      logger.error(`Documentation generation error: ${error.message}`);
      throw error;
    }
  }

  async readerAgent(project) {
    const prompt = `Analyze the following project requirements and extract key information:

Project Title: ${project.title}
Description: ${project.description}
Requirements: ${JSON.stringify(project.requirements)}
Tech Stack: ${project.techStack.join(', ')}
Features: ${project.features.join(', ')}

Provide a structured analysis of:
- Core objectives
- Technical complexity
- Key dependencies
- Risk factors
- Resource requirements`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical reader agent that analyzes project requirements.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.choices[0].message.content);
  }

  async searcherAgent(project, readerAnalysis) {
    const prompt = `Based on this project analysis, suggest relevant technical patterns, best practices, and architectural approaches:

${JSON.stringify(readerAnalysis)}

Tech Stack: ${project.techStack.join(', ')}

Provide:
- Recommended architectural patterns
- API design patterns
- Database schema patterns
- Security considerations
- Scalability approaches`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical searcher agent that finds relevant patterns and best practices.' },
      { role: 'user', content: prompt }
    ]);

    return JSON.parse(response.choices[0].message.content);
  }

  async budgetEstimationAgent(project, readerAnalysis) {
    const prompt = `Estimate the project budget based on the following information:

Project: ${project.title}
Description: ${project.description || 'N/A'}
Tech Stack: ${project.techStack.join(', ') || 'Not specified'}
Features: ${project.features.join(', ') || 'Not specified'}
Timeline: ${project.timeline?.startDate && project.timeline?.endDate 
  ? `${Math.ceil((new Date(project.timeline.endDate) - new Date(project.timeline.startDate)) / (1000 * 60 * 60 * 24))} days`
  : 'Not specified'}
Current Budget (if mentioned): ${project.budget?.amount ? `${project.budget.amount} ${project.budget.currency || 'INR'}` : 'Not specified'}
Analysis: ${JSON.stringify(readerAnalysis)}

Consider:
- Development complexity (frontend, backend, mobile apps)
- Number of features and their complexity
- Tech stack requirements
- Timeline constraints
- Team size needed
- Third-party services (payment gateways, hosting, APIs)
- Testing and QA
- Deployment and DevOps
- Maintenance and support

Provide a detailed budget breakdown in INR with:
- Total estimated budget
- Breakdown by category (Development, Design, Testing, DevOps, Third-party services, Contingency)
- Cost per phase/milestone if applicable
- Assumptions and notes

Return as structured JSON with: totalBudget, currency, breakdown (array of {category, amount, percentage, description}), phases (if applicable), assumptions.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are an expert project cost estimator specializing in software development projects. Provide accurate, realistic budget estimates based on project requirements.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 2000
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async writerAgent(project, readerAnalysis, searcherPatterns, budgetEstimate) {
    const prompt = `Generate comprehensive development documentation for this project:

Project: ${project.title}
Analysis: ${JSON.stringify(readerAnalysis)}
Patterns: ${JSON.stringify(searcherPatterns)}
Budget Estimate: ${JSON.stringify(budgetEstimate)}

Create documentation sections:
1. Project Overview
2. Technical Architecture
3. API Endpoints Specification
4. Database Schema
5. Implementation Timeline
6. Tech Stack Details
7. Features Breakdown
8. Budget Estimation (include the detailed budget breakdown with categories, phases, and assumptions)

Format as structured JSON with each section as a separate field.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical writer agent that creates comprehensive project documentation.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.5,
      max_tokens: 4000
    });

    const docData = JSON.parse(response.choices[0].message.content);
    
    // Structure sections
    const sections = [
      { section: 'overview', content: docData.projectOverview || docData.overview },
      { section: 'architecture', content: docData.technicalArchitecture || docData.architecture },
      { section: 'api_endpoints', content: docData.apiEndpoints || docData.endpoints },
      { section: 'database_schema', content: docData.databaseSchema || docData.schema },
      { section: 'timeline', content: docData.implementationTimeline || docData.timeline },
      { section: 'tech_stack', content: docData.techStackDetails || docData.techStack },
      { section: 'features', content: docData.featuresBreakdown || docData.features },
      { section: 'budget_estimation', content: docData.budgetEstimation || docData.budget || this.formatBudgetEstimate(budgetEstimate) }
    ].filter(s => s.content);

    const fullDocument = sections.map(s => `# ${s.section}\n\n${s.content}`).join('\n\n---\n\n');

    return {
      sections: sections.map(s => ({ ...s, generatedAt: new Date() })),
      fullDocument
    };
  }

  async verifierAgent(project, documentation) {
    const prompt = `Verify the completeness and quality of this documentation:

Project Requirements: ${JSON.stringify(project.requirements)}
Generated Documentation: ${documentation.fullDocument}

Check for:
- Completeness (all sections present)
- Technical accuracy
- Consistency
- Missing information
- Areas needing clarification

Provide verification report with any missing or incomplete sections.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a verification agent that ensures documentation quality and completeness.' },
      { role: 'user', content: prompt }
    ]);

    const verification = JSON.parse(response.choices[0].message.content);
    
    if (verification.completeness < 0.8) {
      logger.warn(`Documentation completeness: ${verification.completeness}`);
    }

    return verification;
  }

  async processOrder(clientId, phoneNumber, initialMessage) {
    try {
      // Create new project - phoneNumber is required, clientId is optional
      const project = new Project({
        clientId: clientId || undefined,
        phoneNumber: phoneNumber,
        title: 'New Project',
        status: 'requirements_capture',
        conversationHistory: [
          { role: 'user', content: initialMessage, timestamp: new Date() }
        ]
      });

      await project.save();

      // Start conversational interface
      const response = await this.respondToMessage(project._id, initialMessage);
      
      return {
        projectId: project._id,
        response
      };
    } catch (error) {
      logger.error(`Order processing error: ${error.message}`);
      throw error;
    }
  }

  async respondToMessage(projectId, message) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Add user message to history
      project.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Generate response
      const systemPrompt = `You are a friendly project requirements specialist. Help the client articulate their tech project needs through natural conversation. Ask clarifying questions about:
- What they want to build
- Technology preferences
- Timeline expectations
- Budget considerations
- Key features and functionality

Be conversational and helpful.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...project.conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const llmResponse = await llmService.chatCompletion(messages, {
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantMessage = llmResponse.choices[0].message.content;

      // Add assistant response to history
      project.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date()
      });

      await project.save();

      return assistantMessage;
    } catch (error) {
      logger.error(`Message response error: ${error.message}`);
      throw error;
    }
  }

  formatBudgetEstimate(budgetEstimate) {
    if (!budgetEstimate) return 'Budget estimation not available.';
    
    let formatted = `## Budget Estimation\n\n`;
    formatted += `**Total Estimated Budget:** ${budgetEstimate.totalBudget || 'N/A'} ${budgetEstimate.currency || 'INR'}\n\n`;
    
    if (budgetEstimate.breakdown && Array.isArray(budgetEstimate.breakdown)) {
      formatted += `### Budget Breakdown\n\n`;
      formatted += `| Category | Amount | Percentage | Description |\n`;
      formatted += `|----------|--------|------------|------------|\n`;
      
      budgetEstimate.breakdown.forEach(item => {
        formatted += `| ${item.category || 'N/A'} | ${item.amount || 'N/A'} ${budgetEstimate.currency || 'INR'} | ${item.percentage || 'N/A'}% | ${item.description || 'N/A'} |\n`;
      });
      formatted += `\n`;
    }
    
    if (budgetEstimate.phases && Array.isArray(budgetEstimate.phases)) {
      formatted += `### Phase-wise Budget\n\n`;
      budgetEstimate.phases.forEach((phase, index) => {
        formatted += `**Phase ${index + 1}: ${phase.name || 'N/A'}**\n`;
        formatted += `- Budget: ${phase.budget || 'N/A'} ${budgetEstimate.currency || 'INR'}\n`;
        formatted += `- Duration: ${phase.duration || 'N/A'}\n`;
        if (phase.description) formatted += `- Description: ${phase.description}\n`;
        formatted += `\n`;
      });
    }
    
    if (budgetEstimate.assumptions && Array.isArray(budgetEstimate.assumptions)) {
      formatted += `### Assumptions\n\n`;
      budgetEstimate.assumptions.forEach((assumption, index) => {
        formatted += `${index + 1}. ${assumption}\n`;
      });
      formatted += `\n`;
    }
    
    return formatted;
  }
}

export default new OrderDocumentationAgent();

