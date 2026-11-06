
import mongoose from 'mongoose'

const councilMemberSchema = new mongoose.Schema({
  ref: { type: String, required: true },
  expertId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true },
  role: { type: String, required: true },
  description: String,
  expertise: [String],
  isHumanLike: { type: Boolean, default: false },
  persona: {
    backstory: String,
    speechPattern: String,
    characterTraits: [String],
    inspiredBy: String,
    systemPrompt: String,
  },
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, maxlength: 120 },
  topic: { type: String, required: true, maxlength: 500 },
  domains: [String],
  council: {
    type: [councilMemberSchema],
    validate: value => value.length >= 2 && value.length <= 12,
  },
  mode: {
    type: String,
    enum: ['manual', 'auto', 'semi_auto'],
    default: 'manual',
  },
  argumentLimit: { type: Number, default: null, min: 1, max: 100 },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'abandoned'],
    default: 'draft',
  },
}, { timestamps: true })

sessionSchema.index({ ownerId: 1, updatedAt: -1 })

export default mongoose.model('Session', sessionSchema)
