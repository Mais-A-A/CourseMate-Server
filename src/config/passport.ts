import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import {
  isUniversityEmail,
  detectRole,
  extractStudentId,
} from '../shared/utils/authUtils.js'
import type { UniversityUser } from '../shared/utils/authUtils.js'
import envVars from '../../env.js'

passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.CLIENT_ID,
      clientSecret: envVars.CLIENT_SECRET,
      callbackURL:
        envVars.NODE_ENV === 'production'
          ? 'https://coursemate.xyz/auth/google/callback'
          : envVars.GOOGLE_CALLBACK_URL,
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
        const user: UniversityUser = {
          email,
          name: profile.displayName ?? email,
          avatar: profile.photos?.[0]?.value ?? '',
          role: detectRole(email),
          studentId: extractStudentId(email),
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
