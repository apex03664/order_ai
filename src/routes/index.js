import express from 'express';
import ordersRouter from './orders.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'ai-manager-order-documentation'
  });
});

// API routes
router.use('/api', ordersRouter);

export default router;

