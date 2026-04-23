import type { UserRole } from '../types/types.js'
import jwt from 'jsonwebtoken'
const UNIVERSITY_DOMAIN1 = 'ppu.edu.ps'
const UNIVERSITY_DOMAIN2 = 'ppu.edu'

export interface UniversityUser {
  email: string
  name: string
  avatar: string
  role: UserRole
  studentId: string | null
}

export function isUniversityEmail(email: string): boolean {
  return (
    email.trim().toLocaleLowerCase().endsWith(`@${UNIVERSITY_DOMAIN1}`) ||
    email.trim().toLocaleLowerCase().endsWith(`@${UNIVERSITY_DOMAIN2}`)
  )
}

export function detectRole(email: string): UserRole {
  const localPart = email.trim().toLocaleLowerCase().split('@')[0]!

  if (isUniversityEmail(email)) {
    if (localPart == 'jabary980') {
      return 'admin'
    } else if (/^\d+$/.test(localPart!)) {
      return 'student'
    }
    return 'supervisor'
  }
  process.exit(1)
}

export function extractStudentId(email: string): string | null {
  const role = detectRole(email)
  if (role !== 'student') return null
  return email.split('@')[0]!
}
export function generateJWT(user: UniversityUser): string {
  const token = jwt.sign(
    {
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      studentId: user.studentId,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' },
  )
  return token
}

export async function verifyJWT(token: string): Promise<UniversityUser | null> {
  try {
    const decoded = (await jwt.verify(
      token,
      process.env.JWT_SECRET!,
    )) as UniversityUser
    return decoded
  } catch (err) {
    console.error('JWT verification failed:', err)
    return null
  }
}
