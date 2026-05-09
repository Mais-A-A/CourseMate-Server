import { vi, describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import cookieParser from 'cookie-parser'
import type { Request, Response, NextFunction } from 'express'

let mockAuthHandler: (req: Request, res: Response, next: NextFunction) => void

vi.mock('passport', () => ({
  default: {
    authenticate: vi.fn((strategy, options) => {
      return (req: Request, res: Response, next: NextFunction) => {
        mockAuthHandler(req, res, next)
      }
    }),
    use: vi.fn(),
    initialize: vi.fn(
      () => (req: Request, res: Response, next: NextFunction) => next(),
    ),
  },
}))

import authRouter from '../src/routes/auth.route.js'
import passport from 'passport'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())
app.use('/api/auth', authRouter)

describe('Auth Routes', () => {
  beforeEach(() => {
    mockAuthHandler = (req, res, next) => {
      req.user = {
        id: '221141',
        email: '221141@ppu.edu.ps',
        name: 'Hasan',
      }
      next()
    }
  })

  it('should authenticate with Google and redirect to dashboard', async () => {
    const response = await request(app).get('/api/auth/google/callback')
    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(
      `${process.env.CLIENT_URL}/dashboard`,
    )
  })

  it('should not return user info on /me endpoint without valid token', async () => {
    const response = await request(app).get('/api/auth/me')
    expect(response.status).toBe(401)
  })

  it('should return user info on /me endpoint with valid token', async () => {
    const response: any = await request(app).get('/api/auth/google/callback')
    const tokenCookie = response.header['set-cookie'][0].split(';')[0]
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [tokenCookie])

    expect(res.status).toBe(200)
    expect(res.body.user).toBeDefined()
    expect(res.body.user.email).toBe('221141@ppu.edu.ps')
  })

  it('should redirect to login on authentication failure', async () => {
    mockAuthHandler = (req, res, next) => {
      res.redirect(`${process.env.CLIENT_URL}/login?error=unauthorized`)
    }

    const res = await request(app).get('/api/auth/google/callback')
    expect(res.status).toBe(302)
    expect(res.header.location).toContain('error=unauthorized')
  })
})
