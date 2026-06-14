import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServiceClient } from '../src/lib/supabase/server';
import { handleDownload } from '../src/lib/upload/downloadHandler';

function getBearerToken(req: VercelRequest): string | null {
  const auth = req.headers.authorization ?? '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const path = req.query.path;
  if (typeof path !== 'string' || !path) {
    return res.status(400).json({ error: 'Missing path query parameter' });
  }

  try {
    const supabase = createServiceClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const result = await handleDownload({ user: userData.user, path });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Download handler error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
