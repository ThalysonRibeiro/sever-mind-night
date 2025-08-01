import { describe, it, expect, jest } from '@jest/globals';
import { googleClient, getGoogleAuthUrl, getGoogleUserInfo } from '../../src/lib/google-auth.ts';

jest.mock('google-auth-library', () => {
  const mockOAuth2Client = {
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
    verifyIdToken: jest.fn(),
  };
  return {
    OAuth2Client: jest.fn(() => mockOAuth2Client),
  };
});

describe('Google Auth', () => {
  it('should generate a Google auth URL', () => {
    const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&include_granted_scopes=true&response_type=code';
    (googleClient.generateAuthUrl as jest.Mock).mockReturnValue(mockUrl);

    const url = getGoogleAuthUrl();

    expect(googleClient.generateAuthUrl).toHaveBeenCalledWith({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      include_granted_scopes: true,
    });
    expect(url).toBe(mockUrl);
  });

  it('should get Google user info', async () => {
    const mockTokens = { tokens: { id_token: 'mock-id-token' } };
    const mockPayload = {
      sub: 'mock-sub',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
    };

    (googleClient.getToken as jest.Mock).mockResolvedValue(mockTokens);
    (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({ getPayload: () => mockPayload });

    const userInfo = await getGoogleUserInfo('mock-code');

    expect(googleClient.getToken).toHaveBeenCalledWith('mock-code');
    expect(googleClient.setCredentials).toHaveBeenCalledWith(mockTokens.tokens);
    expect(googleClient.verifyIdToken).toHaveBeenCalledWith({
      idToken: mockTokens.tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    expect(userInfo).toEqual({
      id: 'mock-sub',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      verified: true,
    });
  });

  it('should throw an error if the payload is invalid', async () => {
    const mockTokens = { tokens: { id_token: 'mock-id-token' } };

    (googleClient.getToken as jest.Mock).mockResolvedValue(mockTokens);
    (googleClient.verifyIdToken as jest.Mock).mockResolvedValue({ getPayload: () => null });

    await expect(getGoogleUserInfo('mock-code')).rejects.toThrow('Invalid Google token');
  });
});
