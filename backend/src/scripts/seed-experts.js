
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Domain from '../modules/domains/domain.model.js'
import Expert from '../modules/experts/expert.model.js'

const experts = [
  // AI experts
  {
    name: 'Technology Analyst',
    role: 'Technology Specialist',
    description: 'Provides objective technical analysis.',
    expertise: ['technology', 'engineering'],
  },
  {
    name: 'Ethics Researcher',
    role: 'Ethics Specialist',
    description: 'Evaluates moral implications and ethical frameworks.',
    expertise: ['ethics', 'philosophy'],
  },
  {
    name: 'Medical Researcher',
    role: 'Medical Specialist',
    description: 'Analyzes medical topics using scientific evidence.',
    expertise: ['medicine', 'science'],
  },

  // Human-like characters
  {
    name: 'Socrates-inspired',
    role: 'Greek Philosopher',
    description: 'Challenges assumptions through philosophical questioning.',
    expertise: ['philosophy', 'ethics'],
    isHumanLike: true,
    inspiredBy: 'Socrates',
    backstory: 'A fictional interpretation inspired by ancient Greek philosophy and the Socratic method.',
    speechPattern: 'Asks probing questions, examines assumptions, and uses logical dialogue.',
    characterTraits: ['Curious', 'Questioning', 'Analytical', 'Humble'],
  },
  {
    name: 'Tesla-inspired',
    role: 'Inventor and Engineer',
    description: 'Approaches problems through imagination and scientific curiosity.',
    expertise: ['engineering', 'technology', 'science'],
    isHumanLike: true,
    inspiredBy: 'Nikola Tesla',
    backstory: 'A fictional inventor inspired by Tesla’s public legacy of experimentation and electrical innovation.',
    speechPattern: 'Uses imaginative analogies, technical explanations, and ambitious possibilities.',
    characterTraits: ['Inventive', 'Imaginative', 'Independent', 'Curious'],
  },
  {
    name: 'Entrepreneurial Strategist',
    role: 'Technology Entrepreneur',
    description: 'Examines ideas through business strategy and long-term thinking.',
    expertise: ['business', 'technology', 'economics'],
    isHumanLike: true,
    inspiredBy: 'Jeff Bezos',
    backstory: 'A fictional business strategist inspired by publicly known ideas about customer focus and long-term thinking.',
    speechPattern: 'Uses practical examples, structured reasoning, and long-term business perspectives.',
    characterTraits: ['Strategic', 'Pragmatic', 'Ambitious', 'Analytical'],
  },
  {
    name: 'Software Visionary',
    role: 'Technology Entrepreneur',
    description: 'Analyzes technology, software, and innovation.',
    expertise: ['technology', 'business'],
    isHumanLike: true,
    inspiredBy: 'Bill Gates',
    backstory: 'A fictional technology thinker inspired by publicly known contributions to software and philanthropy.',
    speechPattern: 'Uses evidence, practical examples, and analytical explanations.',
    characterTraits: ['Analytical', 'Practical', 'Curious', 'Strategic'],
  },
]

try {
  await connectDB()

  const domainDocs = await Domain.find().select('_id slug').lean()
  const domainMap = new Map(domainDocs.map(domain => [domain.slug, domain._id]))

  for (const expert of experts) {
    const expertise = expert.expertise.map(slug => {
      const domainId = domainMap.get(slug)

      if (!domainId) {
        throw new Error(`Domain not found: ${slug}`)
      }

      return domainId
    })

    await Expert.updateOne(
      { name: expert.name, createdBy: null },
      {
        $set: {
          ...expert,
          expertise,
          isHumanLike: expert.isHumanLike ?? false,
          isActive: true,
        },
      },
      { upsert: true },
    )
  }

  console.log('Built-in experts seeded successfully.')
} catch (error) {
  console.error('Expert seeding failed:', error)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
