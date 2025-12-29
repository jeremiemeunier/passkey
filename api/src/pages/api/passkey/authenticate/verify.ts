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
    const { username, credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Credential is required' });
    }

    const result = await passkeyService.verifyAuthentication(username, credential);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Authentication verification error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
