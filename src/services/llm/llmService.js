import sarvamService from './sarvamService.js';
import geminiService from './geminiService.js';
import logger from '../../utils/logger.js';
import { getRedisClient } from '../../config/redis.js';

class LLMService {
  constructor() {
    this.primaryProvider = 'sarvam';
    this.fallbackProvider = 'gemini';
    this.cacheEnabled = true;
  }

  async chatCompletion(messages, options = {}) {
    const cacheKey = this.getCacheKey(messages, options);
    
    // Check cache first
    if (this.cacheEnabled && options.useCache !== false) {
      try {
        const cached = await getRedisClient().get(cacheKey);
        if (cached) {
          logger.debug('LLM response retrieved from cache');
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn(`Cache retrieval error: ${error.message}`);
      }
    }

    // Check if providers are configured
    const sarvamConfigured = !!process.env.SARVAM_API_KEY;
    const geminiConfigured = !!process.env.GEMINI_API_KEY;

    if (!sarvamConfigured && !geminiConfigured) {
      throw new Error('No LLM providers configured. Please set SARVAM_API_KEY or GEMINI_API_KEY in environment variables.');
    }

    // Try primary provider (Sarvam) if configured
    if (sarvamConfigured) {
      try {
        logger.debug('Attempting to use Sarvam LLM provider');
        const response = await sarvamService.chatCompletion(messages, options);
        
        // Cache the response
        if (this.cacheEnabled && options.useCache !== false) {
          try {
            await getRedisClient().setex(cacheKey, 3600, JSON.stringify(response)); // 1 hour cache
          } catch (error) {
            logger.warn(`Cache storage error: ${error.message}`);
          }
        }

        return response;
      } catch (error) {
        logger.warn(`Primary LLM (Sarvam) failed: ${error.message}`);
        if (error.stack) {
          logger.debug(`Sarvam error stack: ${error.stack}`);
        }
      }
    } else {
      logger.warn('Sarvam API key not configured, skipping primary provider');
    }
    
    // Fallback to Gemini if configured
    if (geminiConfigured) {
      try {
        logger.debug('Attempting to use Gemini LLM provider as fallback');
        const response = await geminiService.chatCompletion(messages, options);
        return response;
      } catch (fallbackError) {
        logger.error(`Gemini fallback also failed: ${fallbackError.message}`);
        if (fallbackError.stack) {
          logger.debug(`Gemini error stack: ${fallbackError.stack}`);
        }
      }
    } else {
      logger.warn('Gemini API key not configured, cannot use as fallback');
    }

    // If we get here, both providers failed or are not configured
    const errorMsg = sarvamConfigured && geminiConfigured
      ? 'All LLM providers failed. Please check your API keys and network connectivity.'
      : 'No LLM providers available. Please configure at least one API key (SARVAM_API_KEY or GEMINI_API_KEY).';
    
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  async streamingSTT(audioStream, options = {}) {
    try {
      return await sarvamService.streamingSTT(audioStream, options);
    } catch (error) {
      logger.error(`STT service error: ${error.message}`);
      throw error;
    }
  }

  async textToSpeech(text, options = {}) {
    try {
      return await sarvamService.textToSpeech(text, options);
    } catch (error) {
      logger.error(`TTS service error: ${error.message}`);
      throw error;
    }
  }

  getCacheKey(messages, options) {
    const messageContent = JSON.stringify(messages);
    const optionsContent = JSON.stringify(options);
    return `llm:cache:${Buffer.from(messageContent + optionsContent).toString('base64')}`;
  }

  async clearCache(pattern = 'llm:cache:*') {
    try {
      const keys = await getRedisClient().keys(pattern);
      if (keys.length > 0) {
        await getRedisClient().del(...keys);
        logger.info(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      logger.error(`Cache clear error: ${error.message}`);
    }
  }
}

export default new LLMService();

