import axios from 'axios';
import logger from '../../utils/logger.js';

class SarvamService {
  constructor() {
    this.apiKey = process.env.SARVAM_API_KEY;
    this.baseURL = process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async chatCompletion(messages, options = {}) {
    if (!this.apiKey) {
      throw new Error('Sarvam API key not configured');
    }

    try {
      // Sarvam API requires:
      // 1. Messages must alternate between user and assistant
      // 2. Must start with a user message
      // 3. System messages are not supported in messages array
      
      // Filter and format messages for Sarvam API
      const formattedMessages = [];
      let systemInstruction = '';
      
      // First, extract system messages and filter them out
      for (const msg of messages) {
        if (msg.role === 'system') {
          // Accumulate system instructions
          systemInstruction = systemInstruction 
            ? `${systemInstruction}\n${msg.content}` 
            : msg.content;
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          formattedMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }

      // If we have system instruction but no messages, prepend it to first user message
      if (systemInstruction && formattedMessages.length > 0 && formattedMessages[0].role === 'user') {
        formattedMessages[0].content = `${systemInstruction}\n\n${formattedMessages[0].content}`;
      } else if (systemInstruction && formattedMessages.length === 0) {
        // If only system instruction, create a user message
        formattedMessages.push({
          role: 'user',
          content: systemInstruction
        });
      }

      // Validate message alternation - must start with user and alternate
      if (formattedMessages.length === 0) {
        throw new Error('No valid messages found after filtering');
      }

      // Ensure first message is user (Sarvam requirement)
      if (formattedMessages[0].role !== 'user') {
        // If first message is assistant, prepend a user message with system instruction
        formattedMessages.unshift({
          role: 'user',
          content: systemInstruction || 'Continue the conversation.'
        });
      }

      // Remove consecutive duplicate roles (keep only the last one of each sequence)
      // This ensures proper alternation: user -> assistant -> user -> assistant
      const cleanedMessages = [];
      let lastRole = null;
      
      for (const msg of formattedMessages) {
        if (msg.role !== lastRole) {
          // Role changed, add the message
          cleanedMessages.push(msg);
          lastRole = msg.role;
        } else {
          // Same role as previous - merge content with previous message
          if (cleanedMessages.length > 0) {
            cleanedMessages[cleanedMessages.length - 1].content += '\n\n' + msg.content;
          }
        }
      }

      // Use cleaned messages
      formattedMessages.length = 0;
      formattedMessages.push(...cleanedMessages);

      // Sarvam API format - valid models: 'sarvam-m', 'gemma-4b', 'gemma-12b'
      const requestBody = {
        model: options.model || 'sarvam-m',
        messages: formattedMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000
      };

      // Only include stream if explicitly requested
      if (options.stream) {
        requestBody.stream = options.stream;
      }

      logger.debug(`Sarvam API request: model=${requestBody.model}, messageCount=${formattedMessages.length}`);

      const response = await this.client.post('/v1/chat/completions', requestBody, {
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });

      if (response.status >= 400) {
        const errorMsg = `Sarvam API error ${response.status}: ${JSON.stringify(response.data)}`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      return response.data;
    } catch (error) {
      const errorMessage = error.response 
        ? `Request failed with status code ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error.message;
      logger.error(`Sarvam chat completion error: ${errorMessage}`);
      
      // Log request details for debugging
      if (error.config) {
        logger.error(`Sarvam request URL: ${error.config.url}`);
        logger.error(`Sarvam request data: ${JSON.stringify(error.config.data)}`);
      }
      
      throw error;
    }
  }

  async streamingSTT(audioStream, options = {}) {
    try {
      const response = await this.client.post('/v1/audio/transcriptions', {
        model: 'sarvam-ai/airavat-stt',
        file: audioStream,
        language: options.language || 'en',
        response_format: 'verbose_json',
        timestamp_granularities: ['word']
      }, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Sarvam STT error: ${error.message}`);
      throw error;
    }
  }

  async textToSpeech(text, options = {}) {
    try {
      const response = await this.client.post('/v1/audio/speech', {
        model: 'sarvam-ai/airavat-tts',
        input: text,
        voice: options.voice || 'alloy',
        response_format: 'mp3',
        speed: options.speed || 1.0
      }, {
        responseType: 'arraybuffer'
      });

      return response.data;
    } catch (error) {
      logger.error(`Sarvam TTS error: ${error.message}`);
      throw error;
    }
  }
}

export default new SarvamService();

