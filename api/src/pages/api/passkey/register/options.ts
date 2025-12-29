import type { NextApiRequest, NextApiResponse } from 'next';
import { PasskeyService } from '@/lib/passkey-service';

const passkeyService = new PasskeyService({
  rpName: process.env.RP_NAME || 'Passkey Demo',
  rpID: process.env.RP_ID || 'localhost',
  origin: process.env.ORIGIN || 'http://localhost:3000',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, displayName, userId } = req.body;

    if (!username || !displayName) {
      return res.status(400).json({ error: 'Username and displayName are required' });
    }

    const options = await passkeyService.generateRegistrationOptions(
      username,
      displayName,
      userId
    );

    return res.status(200).json(options);
  } catch (error) {
    console.error('Registration options error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
