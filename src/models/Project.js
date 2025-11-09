import mongoose from 'mongoose';

const requirementSchema = new mongoose.Schema({
  category: String,
  description: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
});

const documentationSectionSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['overview', 'architecture', 'api_endpoints', 'database_schema', 'timeline', 'tech_stack', 'features', 'budget_estimation']
  },
  content: String,
  generatedAt: Date
});

const projectSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  requirements: [requirementSchema],
  techStack: [String],
  features: [String],
  timeline: {
    startDate: Date,
    endDate: Date,
    milestones: [{
      name: String,
      date: Date,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }]
  },
  budget: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  documentation: {
    sections: [documentationSectionSchema],
    fullDocument: String,
    generatedAt: Date,
    version: {
      type: Number,
      default: 1
    }
  },
  status: {
    type: String,
    enum: ['draft', 'requirements_capture', 'documentation', 'approved', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  conversationHistory: [{
    role: String,
    content: String,
    timestamp: Date
  }],
  assignedTeam: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Project', projectSchema);

