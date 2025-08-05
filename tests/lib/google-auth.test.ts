import { describe, it, expect, jest } from '@jest/globals';
import { googleClient, getGoogleAuthUrl, getGoogleUserInfo } from '../../src/lib/google-auth';

jest.mock('google-auth-library', () => {
  const mockOAuth2Client = {
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    setCredentials: jest.fn(),
    request: jest.fn(),
  };
  return {
    OAuth2Client: jest.fn(() => mockOAuth2Client),
  };
});

describe('Google Auth', () => {
  it('should generate a Google auth URL', () => {
    const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&response_type=code';
    (googleClient.generateAuthUrl as jest.Mock).mockReturnValue(mockUrl);

    const url = getGoogleAuthUrl();

    expect(googleClient.generateAuthUrl).toHaveBeenCalledWith({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
    expect(url).toBe(mockUrl);
  });

  it('should get Google user info', async () => {
    const mockTokens = { tokens: { access_token: 'mock-access-token' } };
    const mockUserInfo = {
      id: 'mock-sub',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      verified_email: true,
    };

    (googleClient.getToken as jest.Mock).mockResolvedValue(mockTokens);
    (googleClient.request as jest.Mock).mockResolvedValue({ data: mockUserInfo });

    const userInfo = await getGoogleUserInfo('mock-code');

    expect(googleClient.getToken).toHaveBeenCalledWith('mock-code');
    expect(googleClient.setCredentials).toHaveBeenCalledWith(mockTokens.tokens);
    expect(googleClient.request).toHaveBeenCalledWith({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });
    expect(userInfo).toEqual(mockUserInfo);
  });

  it('should throw an error if the payload is invalid', async () => {
    const mockTokens = { tokens: { access_token: 'mock-access-token' } };

    (googleClient.getToken as jest.Mock).mockResolvedValue(mockTokens);
    (googleClient.request as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    await expect(getGoogleUserInfo('mock-code')).rejects.toThrow('Invalid token');
  });
});
