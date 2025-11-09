import express from 'express';
import orderDocumentationAgent from '../agents/orderDocumentationAgent.js';
import Project from '../models/Project.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Start new order/project
router.post('/orders', async (req, res, next) => {
  try {
    const { phoneNumber, initialMessage } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'phoneNumber is required' });
    }

    if (!initialMessage) {
      return res.status(400).json({ error: 'initialMessage is required' });
    }

    // Check if there's an existing active chat for this phone number
    const existingProject = await Project.findOne({
      phoneNumber: phoneNumber,
      status: { $in: ['draft', 'requirements_capture'] }
    }).sort({ updatedAt: -1 });

    if (existingProject) {
      // Continue existing chat
      const response = await orderDocumentationAgent.respondToMessage(existingProject._id, initialMessage);
      return res.json({
        projectId: existingProject._id,
        response,
        isExistingChat: true
      });
    }

    // Create new chat
    const clientId = req.body.clientId || null;
    const result = await orderDocumentationAgent.processOrder(clientId, phoneNumber, initialMessage);
    res.json({
      ...result,
      isExistingChat: false
    });
  } catch (error) {
    next(error);
  }
});

// Continue conversation
router.post('/orders/:projectId/message', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const response = await orderDocumentationAgent.respondToMessage(projectId, message);
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

// Generate documentation
router.post('/orders/:projectId/generate-documentation', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const documentation = await orderDocumentationAgent.generateDocumentation(projectId);
    res.json({ documentation });
  } catch (error) {
    next(error);
  }
});

// Get project details
router.get('/orders/:projectId', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('clientId');
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// Get chat by phone number
router.get('/orders/phone/:phoneNumber', async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Get the most recent active chat for this phone number
    const project = await Project.findOne({
      phoneNumber: phoneNumber,
      status: { $in: ['draft', 'requirements_capture'] }
    })
      .populate('clientId')
      .sort({ updatedAt: -1 });

    if (!project) {
      return res.status(404).json({ error: 'No active chat found for this phone number' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// List all projects
router.get('/orders', async (req, res, next) => {
  try {
    const { clientId, phoneNumber, status } = req.query;
    const query = {};

    if (clientId) query.clientId = clientId;
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('clientId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

export default router;

