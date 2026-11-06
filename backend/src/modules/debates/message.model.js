import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  speakerType: {
    type: String,
    enum: ['expert', 'user', 'system'],
    required: true,
  },
  speakerRef: {
    type: String,
    default: null,
  },
  speakerName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true })

messageSchema.index(
  { sessionId: 1, sequence: 1 },
  { unique: true }
)

export default mongoose.model('Message', messageSchema)