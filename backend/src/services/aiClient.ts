import axios from 'axios';
import redis from './redis';
import crypto from 'crypto';
import logger from './logger';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000/api';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 120000,
});

// PHASE 8: COST OPTIMIZATION CACHE
export const callAIWithCache = async (endpoint: string, payload: any, ttl = 3600) => {
  const cacheKey = `ai_cache:${endpoint}:${crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')}`;
  
  try {
     const cached = await redis.get(cacheKey);
     if (cached) {
        logger.info(`[AI CACHE] Hit for ${endpoint}`);
        return JSON.parse(cached);
     }
  } catch (err) {
     logger.warn('[AI CACHE] Redis error, bypassing cache');
  }

  const response = await aiClient.post(endpoint, payload);
  
  try {
     await redis.setex(cacheKey, ttl, JSON.stringify(response.data));
  } catch (err) {
     logger.warn('[AI CACHE] Failed to set cache');
  }

  return response.data;
};

export default aiClient;
