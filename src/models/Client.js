import mongoose from 'mongoose';

const socialProfileSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['linkedin', 'twitter', 'facebook', 'instagram'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  lastScraped: Date,
  metadata: mongoose.Schema.Types.Mixed
});

const projectHistorySchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  status: String,
  startDate: Date,
  endDate: Date
});

const clientSchema = new mongoose.Schema({
  companyInfo: {
    name: { type: String, required: true },
    industry: String,
    size: String,
    website: String,
    description: String
  },
  contactDetails: {
    primaryContact: {
      name: String,
      email: String,
      phone: String,
      role: String
    },
    additionalContacts: [{
      name: String,
      email: String,
      phone: String,
      role: String
    }]
  },
  socialProfiles: [socialProfileSchema],
  projectHistory: [projectHistorySchema],
  leadScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['lead', 'prospect', 'client', 'inactive'],
    default: 'lead'
  },
  tags: [String],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

clientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Client', clientSchema);

