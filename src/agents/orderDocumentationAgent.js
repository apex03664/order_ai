import llmService from '../services/llm/llmService.js';
import Project from '../models/Project.js';
import logger from '../utils/logger.js';

class OrderDocumentationAgent {
  constructor() {
    this.name = 'OrderDocumentationAgent';
  }

  // Helper function to extract JSON from markdown code blocks
  extractJSON(content) {
    if (!content) {
      logger.error('extractJSON: Content is empty or null');
      return null;
    }
    
    try {
      // Remove markdown code blocks if present
      let cleaned = content.trim();
      
      // First, try to find and extract JSON from code blocks (most common case)
      // Match ```json ... ``` or ``` ... ``` patterns
      const codeBlockPattern = /```(?:json)?\s*([\s\S]*?)\s*```/g;
      const codeBlockMatches = [...cleaned.matchAll(codeBlockPattern)];
      
      if (codeBlockMatches.length > 0) {
        // Use the first code block found
        cleaned = codeBlockMatches[0][1].trim();
        logger.debug('Extracted JSON from code block');
      } else {
        // If no code blocks, try to find JSON object or array directly
        // Look for the first { or [ and match until the closing } or ]
        const jsonStart = cleaned.search(/[\{\[]/);
        if (jsonStart !== -1) {
          let braceCount = 0;
          let bracketCount = 0;
          let inString = false;
          let escapeNext = false;
          let jsonEnd = jsonStart;
          
          for (let i = jsonStart; i < cleaned.length; i++) {
            const char = cleaned[i];
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (char === '[') bracketCount++;
              if (char === ']') bracketCount--;
              
              if (braceCount === 0 && bracketCount === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
          }
          
          if (jsonEnd > jsonStart) {
            cleaned = cleaned.substring(jsonStart, jsonEnd);
            logger.debug('Extracted JSON from content');
          }
        }
      }
      
      // Clean up the JSON string
      cleaned = cleaned.trim();
      
      // Remove any leading/trailing non-JSON characters
      cleaned = cleaned.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      
      // Fix common JSON issues
      // Remove trailing commas before } or ]
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
      // Remove comments (not valid in JSON but sometimes LLMs add them)
      cleaned = cleaned.replace(/\/\/.*$/gm, '');
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
      
      // Try to parse
      const parsed = JSON.parse(cleaned);
      logger.debug('Successfully parsed JSON');
      return parsed;
      
    } catch (error) {
      logger.error(`JSON extraction failed: ${error.message}`);
      logger.error(`Original content (first 1000 chars): ${content.substring(0, 1000)}`);
      
      // Last resort: try to find any JSON-like structure
      try {
        const jsonLike = content.match(/\{[\s\S]{10,}\}|\[[\s\S]{10,}\]/);
        if (jsonLike) {
          let attempt = jsonLike[0];
          attempt = attempt.replace(/,(\s*[}\]])/g, '$1');
          attempt = attempt.replace(/\/\/.*$/gm, '');
          const parsed = JSON.parse(attempt);
          logger.debug('Successfully parsed JSON on second attempt');
          return parsed;
        }
      } catch (secondError) {
        logger.error(`Second attempt also failed: ${secondError.message}`);
      }
      
      throw new Error(`Failed to parse JSON response: ${error.message}. Content preview: ${content.substring(0, 200)}`);
    }
  }

  async captureRequirements(clientId, conversationHistory) {
    try {
      const systemPrompt = `You are an expert requirements analyst. Analyze the conversation to extract:
1. Tech stack preferences
2. Key features and functionality
3. Timeline expectations
4. Budget range
5. Project scope and complexity

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with these fields:
{
  "techStack": ["tech1", "tech2"],
  "features": ["feature1", "feature2"],
  "timeline": "timeline description",
  "budget": "budget description",
  "scope": "scope description"
}

Return ONLY the JSON object, nothing else.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: 'Extract and structure the project requirements from this conversation. Return ONLY valid JSON, no markdown, no explanations, no code blocks.' }
      ];

      const response = await llmService.chatCompletion(messages, {
        temperature: 0.3,
        max_tokens: 2000
      });

      const requirements = this.extractJSON(response.choices[0].message.content);
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

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with the following structure:

{
  "coreObjectives": ["objective1", "objective2"],
  "technicalComplexity": "low|medium|high",
  "keyDependencies": ["dependency1", "dependency2"],
  "riskFactors": ["risk1", "risk2"],
  "resourceRequirements": {
    "teamSize": number,
    "timeline": "description",
    "skills": ["skill1", "skill2"]
  }
}

Return ONLY the JSON object, nothing else.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical reader agent that analyzes project requirements. You MUST always return valid JSON only, never markdown or explanations.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 1500
    });

    return this.extractJSON(response.choices[0].message.content);
  }

  async searcherAgent(project, readerAnalysis) {
    const prompt = `Based on this project analysis, suggest relevant technical patterns, best practices, and architectural approaches:

${JSON.stringify(readerAnalysis)}

Tech Stack: ${project.techStack.join(', ')}

IMPORTANT: Recommend MERN stack patterns (MongoDB, Express.js, React, Node.js) for web applications and React Native patterns for mobile applications. If different technologies are mentioned, suggest MERN stack alternatives.

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with the following structure:

{
  "architecturalPatterns": ["pattern1", "pattern2"],
  "apiDesignPatterns": ["pattern1", "pattern2"],
  "databaseSchemaPatterns": ["pattern1", "pattern2"],
  "securityConsiderations": ["consideration1", "consideration2"],
  "scalabilityApproaches": ["approach1", "approach2"]
}

Return ONLY the JSON object, nothing else.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical searcher agent that finds relevant patterns and best practices. Always recommend MERN stack for web and React Native for mobile. You MUST always return valid JSON only, never markdown or explanations.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 1500
    });

    return this.extractJSON(response.choices[0].message.content);
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

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with this exact structure:

{
  "totalBudget": number,
  "currency": "INR",
  "breakdown": [
    {
      "category": "Development",
      "amount": number,
      "percentage": number,
      "description": "description"
    }
  ],
  "phases": [
    {
      "name": "Phase name",
      "budget": number,
      "duration": "duration",
      "description": "description"
    }
  ],
  "assumptions": ["assumption1", "assumption2"]
}

Return ONLY the JSON object, nothing else.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are an expert project cost estimator specializing in software development projects. Provide accurate, realistic budget estimates based on project requirements. You MUST always return valid JSON only, never markdown or explanations.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 2000
    });

    return this.extractJSON(response.choices[0].message.content);
  }

  async writerAgent(project, readerAnalysis, searcherPatterns, budgetEstimate) {
    const prompt = `Generate comprehensive development documentation for this project:

Project: ${project.title}
Analysis: ${JSON.stringify(readerAnalysis)}
Patterns: ${JSON.stringify(searcherPatterns)}
Budget Estimate: ${JSON.stringify(budgetEstimate)}

IMPORTANT: Use MERN stack (MongoDB, Express.js, React, Node.js) for web applications and React Native for mobile applications. If the project mentions different technologies, change them to MERN stack and React Native in the documentation.

Create documentation sections:
1. Project Overview
2. Technical Architecture (use MERN stack for web, React Native for mobile)
3. API Endpoints Specification (Express.js/Node.js REST APIs)
4. Database Schema (MongoDB with Mongoose ODM)
5. Implementation Timeline
6. Tech Stack Details (MERN: MongoDB, Express.js, React, Node.js for web; React Native for mobile)
7. Features Breakdown
8. Budget Estimation (include the detailed budget breakdown with categories, phases, and assumptions)

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with this exact structure:

{
  "projectOverview": "overview text",
  "technicalArchitecture": "architecture text",
  "apiEndpoints": "endpoints text",
  "databaseSchema": "schema text",
  "implementationTimeline": "timeline text",
  "techStackDetails": "tech stack text",
  "featuresBreakdown": "features text",
  "budgetEstimation": "budget text"
}

Return ONLY the JSON object, nothing else.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a technical writer agent that creates comprehensive project documentation. You MUST always return valid JSON only, never markdown or explanations.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.5,
      max_tokens: 4000
    });

    const docData = this.extractJSON(response.choices[0].message.content);
    
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

IMPORTANT: You MUST return ONLY valid JSON, no markdown, no explanations, no code blocks. Return a JSON object with this structure:

{
  "completeness": 0.0 to 1.0,
  "technicalAccuracy": "assessment",
  "consistency": "assessment",
  "missingInformation": ["item1", "item2"],
  "areasNeedingClarification": ["area1", "area2"]
}

Return ONLY the JSON object, nothing else.`;

    const response = await llmService.chatCompletion([
      { role: 'system', content: 'You are a verification agent that ensures documentation quality and completeness. You MUST always return valid JSON only, never markdown or explanations.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 1000
    });

    const verification = this.extractJSON(response.choices[0].message.content);
    
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
      const systemPrompt = `You are a friendly project requirements specialist. Help the client articulate their tech project needs through natural conversation.

IMPORTANT: You MUST prefer and recommend MERN stack (MongoDB, Express.js, React, Node.js) for web applications and React Native for mobile applications. If the user mentions different technologies, gently guide them toward MERN stack and React Native by explaining the benefits:
- MERN stack: Full JavaScript stack, faster development, large community, scalable, cost-effective
- React Native: Code once, deploy to iOS and Android, shared codebase, native performance, faster development

Ask clarifying questions about:
- What they want to build
- Timeline expectations
- Budget considerations
- Key features and functionality

Always suggest MERN stack for web and React Native for mobile, but be respectful if they have strong preferences. Be conversational and helpful.`;

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

