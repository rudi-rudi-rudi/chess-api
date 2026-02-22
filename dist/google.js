import { OAuth2Client } from 'google-auth-library';
const googleClientId = process.env.GOOGLE_CLIENT_ID;
if (!googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is required');
}
const client = new OAuth2Client(googleClientId);
export async function verifyGoogleIdToken(idToken) {
    const ticket = await client.verifyIdToken({ idToken, audience: googleClientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.name) {
        throw new Error('Invalid Google token payload');
    }
    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture ?? null
    };
}
