import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  phoneNumber: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound'
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'completed', 'failed', 'no_answer'],
    default: 'initiated'
  },
  transcript: {
    fullTranscript: String,
    segments: [{
      speaker: {
        type: String,
        enum: ['agent', 'caller']
      },
      text: String,
      timestamp: Number,
      confidence: Number
    }]
  },
  verificationData: {
    name: String,
    company: String,
    projectInterest: String,
    budgetRange: String,
    timeline: String,
    verified: {
      type: Boolean,
      default: false
    }
  },
  recordingUrl: String,
  duration: {
    type: Number,
    default: 0
  },
  startedAt: Date,
  endedAt: Date,
  metadata: {
    agentId: String,
    callId: String,
    sipCallId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

callSchema.index({ leadId: 1 });
callSchema.index({ clientId: 1 });
callSchema.index({ phoneNumber: 1 });
callSchema.index({ startedAt: -1 });

export default mongoose.model('Call', callSchema);

