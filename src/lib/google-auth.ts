import { OAuth2Client } from 'google-auth-library'
import { config } from '../config/env.ts'

export const googleClient = new OAuth2Client(
  config.GOOGLE_CLIENT_ID,
  config.GOOGLE_CLIENT_SECRET,
  config.GOOGLE_REDIRECT_URI
)

export const getGoogleAuthUrl = () => {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    include_granted_scopes: true,
  })
}

export const getGoogleUserInfo = async (code: string) => {
  const { tokens } = await googleClient.getToken(code)
  googleClient.setCredentials(tokens);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: config.GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()
  if (!payload) {
    throw new Error('Invalid Google token')
  }

  return {
    id: payload.sub,
    email: payload.email!,
    name: payload.name!,
    picture: payload.picture,
    verified: payload.email_verified || false,
  }
}