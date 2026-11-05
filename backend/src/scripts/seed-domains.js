
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Domain from '../modules/domains/domain.model.js'

const domains = [
  ['Philosophy', 'philosophy'],
  ['Technology', 'technology'],
  ['Medicine', 'medicine'],
  ['Ethics', 'ethics'],
  ['Psychology', 'psychology'],
  ['Economics', 'economics'],
  ['Law', 'law'],
  ['Politics', 'politics'],
  ['Science', 'science'],
  ['Engineering', 'engineering'],
  ['Education', 'education'],
  ['Environment', 'environment'],
  ['History', 'history'],
  ['Sociology', 'sociology'],
  ['Business', 'business'],
]

try {
  await connectDB()

  for (const [name, slug] of domains) {
    await Domain.updateOne(
      { slug },
      { $setOnInsert: { name, slug } },
      { upsert: true },
    )
  }

  console.log('Domains seeded successfully.')
} catch (error) {
  console.error('Domain seeding failed:', error)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
