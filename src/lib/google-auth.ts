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
    ]
  })
}

export const getGoogleUserInfo = async (code: string) => {
  const { tokens } = await googleClient.getToken(code)
  googleClient.setCredentials(tokens)

  const userInfoResponse = await googleClient.request({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo'
  })

  return userInfoResponse.data as any
}