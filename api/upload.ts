import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServiceClient } from '../src/lib/supabase/server';
import { parseMultipart } from '../src/lib/upload/parseMultipart';
import { handleUpload, isUploadCategory } from '../src/lib/upload/uploadHandler';

function getBearerToken(req: VercelRequest): string | null {
  const auth = req.headers.authorization ?? '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const supabase = createServiceClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { fields, files } = await parseMultipart(req);
    const file = files.find((f) => f.fieldname === 'file');
    if (!file) {
      return res.status(400).json({ error: 'No file field named "file" found' });
    }

    const category = fields.category;
    if (!isUploadCategory(category)) {
      return res.status(400).json({ error: `Invalid or missing category: ${category}` });
    }

    if (!fields.entityType || !fields.entityId) {
      return res.status(400).json({ error: 'Missing entityType or entityId' });
    }

    const result = await handleUpload({
      user: userData.user,
      category,
      entityType: fields.entityType,
      entityId: fields.entityId,
      file,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Upload handler error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Forbidden' || message.includes('not allowed') ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
