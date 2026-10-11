import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import {
  isUniversityEmail,
  detectRole,
} from '../shared/utils/authUtils.js'
import type { UniversityUser } from '../shared/utils/authUtils.js'
import envVars from '../../env.js'
import { User } from '../features/user/user.model.js'
import { isBootstrapAdmin } from '../shared/utils/authUtils.js'

// "221141@ppu.edu" and "221141@ppu.edu.ps" are the same account
export async function roleFromDatabase(email: string) {
  const local = email.trim().toLowerCase().split('@')[0]!.replace(/[^a-z0-9._-]/g, '')
  const record = await User.findOne({ email: { $regex: `^${local}@ppu\\.edu(\\.ps)?$`, $options: 'i' } })
    .select('role')
    .lean()
  return record?.role ?? null
}

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.CLIENT_ID,
      clientSecret: envVars.CLIENT_SECRET,
      callbackURL: envVars.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value

        if (!email) {
          return done(null, false, {
            message: 'No email found in Google profile',
          })
        }
        if (!isUniversityEmail(email)) {
          return done(null, false, {
            message: 'Email is not a university email',
          })
        }
        // The database is the source of truth; the email pattern is only the fallback for unknown users.
        const role = isBootstrapAdmin(email)
          ? 'supervisor'
          : ((await roleFromDatabase(email)) ?? detectRole(email))
        const user: UniversityUser = {
          email,
          name: profile.displayName ?? email,
          avatar: profile.photos?.[0]?.value ?? '',
          role,
          studentId: role === 'student' ? email.split('@')[0]! : null,
        }
        return done(null, user)
      } catch (err) {
        return done(err)
      }
    },
  ),
)
export { passport }
export default passport
