import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  chunks: [{
    text: String,
    embedding: [Number],
    metadata: {
      section: String,
      category: String,
      keywords: [String]
    }
  }],
  metadata: {
    title: String,
    category: {
      type: String,
      enum: ['workflow', 'policy', 'service', 'pricing', 'onboarding', 'process', 'other']
    },
    source: String,
    author: String,
    tags: [String],
    version: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

knowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

knowledgeBaseSchema.index({ 'metadata.category': 1 });
knowledgeBaseSchema.index({ 'metadata.tags': 1 });

export default mongoose.model('KnowledgeBase', knowledgeBaseSchema);

