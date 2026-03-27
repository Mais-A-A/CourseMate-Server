import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { beforeAll, afterAll } from 'vitest'
import env from '../env.js'
import { connectDatabase } from '../src/config/db.js'
import { afterEach } from 'node:test'
let mongoServer: MongoMemoryServer | null = null
const USE_REAL_DB = env.USE_REAL === 'true'

beforeAll(async () => {
  if (USE_REAL_DB) {
    await connectDatabase()
  } else {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  }
})
afterEach(async () => {
  if (USE_REAL_DB) {
    const collections = mongoose.connection.collections
    await Promise.all(
      Object.values(collections).map((col) => col.deleteMany({})),
    )
  }
})

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections
    await Promise.all(
      Object.values(collections).map((col) => col.deleteMany({})),
    )
  }
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})
