
import mongoose from 'mongoose'

const expertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  role: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  expertise: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true,
  }],

  isHumanLike: {
    type: Boolean,
    default: false,
  },

  // Human-like character fields
  backstory: {
    type: String,
    maxlength: 2000,
    required: function () {
      return this.isHumanLike
    },
  },

  speechPattern: {
    type: String,
    maxlength: 1000,
    required: function () {
      return this.isHumanLike
    },
  },

  characterTraits: {
    type: [String],
    default: [],
    validate: {
      validator: function (traits) {
        return !this.isHumanLike || traits.length > 0
      },
      message: 'Human-like characters must have at least one character trait.',
    },
  },

  inspiredBy: {
    type: String,
    trim: true,
    maxlength: 100,
  },

  systemPrompt: {
    type: String,
    maxlength: 4000,
  },

  // null = built-in expert; user ID = private custom expert
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true })

expertSchema.index({ expertise: 1, isHumanLike: 1 })
expertSchema.index({ createdBy: 1, isActive: 1 })

export default mongoose.model('Expert', expertSchema)
