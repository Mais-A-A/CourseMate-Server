import { describe, it, expect } from 'vitest'
import { detectRole, isBootstrapAdmin } from '../src/shared/utils/authUtils.js'
import { requireOwnSupervisorQuery } from '../src/shared/middlewares/auth.middleware.js'

describe('role detection fallbacks', () => {
  it('numeric ids are students, other university emails supervisors', () => {
    expect(detectRole('999999@ppu.edu.ps')).toBe('student')
    expect(detectRole('doctor1@ppu.edu.ps')).toBe('supervisor')
  })
  it('rejects non-university emails', () => {
    expect(() => detectRole('x@gmail.com')).toThrow()
  })
  it('bootstrap admins come from ADMIN_USERS, defaulting to the existing admin', () => {
    const saved = process.env.ADMIN_USERS
    delete process.env.ADMIN_USERS
    expect(isBootstrapAdmin('221141@ppu.edu.ps')).toBe(true)
    process.env.ADMIN_USERS = 'boss1, boss2'
    expect(isBootstrapAdmin('BOSS2@ppu.edu.ps')).toBe(true)
    expect(isBootstrapAdmin('221141@ppu.edu.ps')).toBe(false)
    if (saved === undefined) delete process.env.ADMIN_USERS
    else process.env.ADMIN_USERS = saved
  })
})

describe('requireOwnSupervisorQuery', () => {
  const run = (role: string, email: string, query: Record<string, unknown>) => {
    let status = 200
    const res: any = { status: (c: number) => ((status = c), res), json: () => res }
    requireOwnSupervisorQuery()({ currentUser: { role, email }, query } as any, res, () => {})
    return status
  }
  it('lets a supervisor query their own students only', () => {
    expect(run('supervisor', 'sup1@ppu.edu.ps', { supervisorEmail: 'sup1@ppu.edu' })).toBe(200)
    expect(run('supervisor', 'sup1@ppu.edu.ps', { supervisorEmail: 'sup2@ppu.edu' })).toBe(403)
    expect(run('supervisor', 'sup1@ppu.edu.ps', {})).toBe(403)
  })
  it('lets admins query anyone', () => {
    expect(run('admin', 'adm@ppu.edu.ps', { supervisorEmail: 'sup2@ppu.edu' })).toBe(200)
  })
})

import env from '../env.js'
import { roleFromDatabase } from '../src/config/passport.js'
import { User } from '../src/features/user/user.model.js'

if (env.USE_REAL === 'false') {
  describe('role from database', () => {
    it('uses the stored role regardless of email form, and null for unknown users', async () => {
      await User.create({ name: 'T', email: '123456@ppu.edu', password: 'x', role: 'supervisor' })
      expect(await roleFromDatabase('123456@ppu.edu.ps')).toBe('supervisor')
      expect(await roleFromDatabase('123456@PPU.edu')).toBe('supervisor')
      expect(await roleFromDatabase('654321@ppu.edu.ps')).toBeNull()
      expect(await roleFromDatabase('.*@ppu.edu.ps')).toBeNull() // regex characters are not interpreted
    })
  })
}
