import { describe, it, expect } from 'vitest'
import { requireSelfOrStaff } from '../src/shared/middlewares/auth.middleware.js'
import { generateJWT } from '../src/shared/utils/authUtils.js'

function run(email: string, role: 'student' | 'admin' | 'supervisor', target: string | null) {
  const token = generateJWT({ email, name: 'x', avatar: '', role, studentId: null })
  const req: any = { cookies: {}, headers: { authorization: `Bearer ${token}` } }
  let status = 200
  const res: any = {
    status(c: number) {
      status = c
      return this
    },
    json() {
      return this
    },
  }
  return requireSelfOrStaff(() => target)(req, res, () => {}).then(() => status)
}

describe('requireSelfOrStaff', () => {
  it('lets a student access their own record (.ps / non-.ps email forms)', async () => {
    expect(await run('221141@ppu.edu.ps', 'student', '221141@ppu.edu')).toBe(200)
  })
  it("blocks a student from another student's record", async () => {
    expect(await run('221141@ppu.edu.ps', 'student', '999999@ppu.edu')).toBe(403)
  })
  it('blocks when the target does not exist', async () => {
    expect(await run('221141@ppu.edu.ps', 'student', null)).toBe(403)
  })
  it("blocks a supervisor from a student who isn't theirs, and admins from anyone else's record", async () => {
    expect(await run('sup@ppu.edu.ps', 'supervisor', '999999@ppu.edu')).toBe(403)
    expect(await run('adm@ppu.edu.ps', 'admin', '999999@ppu.edu')).toBe(403)
    expect(await run('adm@ppu.edu.ps', 'admin', null)).toBe(403)
  })
  it("lets an admin or supervisor access their own record", async () => {
    expect(await run('adm@ppu.edu.ps', 'admin', 'adm@ppu.edu')).toBe(200)
    expect(await run('sup@ppu.edu.ps', 'supervisor', 'sup@ppu.edu')).toBe(200)
  })
})
