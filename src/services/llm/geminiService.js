import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../../utils/logger.js';

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('Gemini API key not found. Gemini service will not be available.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async chatCompletion(messages, options = {}) {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      // Valid Gemini model names (as of 2024):
      // - gemini-1.5-pro (stable, recommended)
      // - gemini-1.5-flash (faster, lighter)
      // - gemini-pro (legacy, may be deprecated)
      // The error showed gemini-1.5-flash without version is not found
      // Using gemini-1.5-pro as default (most stable)
      const modelName = options.model || 'gemini-1.5-pro';
      
      // Convert messages format for Gemini API
      // Separate system message and conversation history
      let systemInstruction = '';
      const conversationHistory = [];
      
      for (const msg of messages) {
        if (msg.role === 'system') {
          // Accumulate system instructions
          systemInstruction = systemInstruction 
            ? `${systemInstruction}\n${msg.content}` 
            : msg.content;
        } else if (msg.role === 'user') {
          conversationHistory.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
          conversationHistory.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }

      // Ensure we have at least one user message
      if (conversationHistory.length === 0) {
        // If we have system instruction but no messages, use system instruction as first user message
        const firstUserMessage = systemInstruction || 'Hello';
        conversationHistory.push({ role: 'user', parts: [{ text: firstUserMessage }] });
        systemInstruction = ''; // Clear it since we used it as a message
      }

      // Create model configuration
      const modelConfig = { 
        model: modelName
      };

      // Add system instruction if present (as string) - only if we didn't use it as a message
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }

      const model = this.genAI.getGenerativeModel(modelConfig);

      // Build the request - always use conversationHistory
      const requestConfig = {
        contents: conversationHistory,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.max_tokens || 2000,
        }
      };

      logger.debug(`Gemini API request: model=${modelName}, messages=${conversationHistory.length}, hasSystemInstruction=${!!systemInstruction}`);

      const result = await model.generateContent(requestConfig);
      const response = await result.response;
      const text = response.text();
      
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: text
          }
        }]
      };
    } catch (error) {
      logger.error(`Gemini chat completion error: ${error.message}`);
      if (error.response) {
        logger.error(`Gemini API response: ${JSON.stringify(error.response.data)}`);
      }
      // Log more details for debugging
      if (error.cause) {
        logger.error(`Gemini error cause: ${JSON.stringify(error.cause)}`);
      }
      throw error;
    }
  }
}

export default new GeminiService();

