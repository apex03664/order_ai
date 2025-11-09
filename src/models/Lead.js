import mongoose from 'mongoose';

const conversationMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: mongoose.Schema.Types.Mixed
});

const leadSchema = new mongoose.Schema({
  profileUrl: {
    type: String,
    required: true,
    unique: true
  },
  platform: {
    type: String,
    enum: ['linkedin', 'twitter', 'email', 'phone', 'other'],
    required: true
  },
  profileData: {
    name: String,
    company: String,
    title: String,
    bio: String,
    location: String,
    followers: Number,
    posts: [{
      content: String,
      timestamp: Date,
      engagement: Number
    }],
    extractedInfo: mongoose.Schema.Types.Mixed
  },
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  contactStatus: {
    type: String,
    enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'lost'],
    default: 'new'
  },
  lastContacted: Date,
  lastScraped: Date,
  conversationHistory: [conversationMessageSchema],
  personalizationData: {
    painPoints: [String],
    interests: [String],
    recentAnnouncements: [String],
    techStack: [String],
    customNotes: String
  },
  outreachHistory: [{
    type: {
      type: String,
      enum: ['email', 'dm', 'call', 'linkedin_message']
    },
    content: String,
    sentAt: Date,
    opened: Boolean,
    clicked: Boolean,
    responded: Boolean
  }],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

leadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

leadSchema.index({ profileUrl: 1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ contactStatus: 1 });
leadSchema.index({ lastContacted: 1 });

export default mongoose.model('Lead', leadSchema);

