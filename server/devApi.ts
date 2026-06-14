/**
 * Local development API server.
 * Mirrors the Vercel serverless functions in /api so the Vite dev proxy can
 * route /api/* requests here without needing the Vercel CLI.
 *
 * Run with: npx tsx server/devApi.ts
 */

import http from 'http';
import { URL } from 'url';
import { createServiceClient } from '../src/lib/supabase/server';
import { parseMultipart } from '../src/lib/upload/parseMultipart';
import { handleUpload, isUploadCategory } from '../src/lib/upload/uploadHandler';
import { handleDownload } from '../src/lib/upload/downloadHandler';

const PORT = process.env.PORT ?? 3001;

function json(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function getBearerToken(req: http.IncomingMessage): string | null {
  const auth = req.headers.authorization ?? '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function handleRegister(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = (await readJsonBody(req)) as Record<string, unknown>;
  const {
    fullName,
    email,
    phone,
    password,
    licenseNumber,
    hospitalAffiliation,
    signatureText,
    consentPrintedAt,
  } = body;

  const normalizedEmail = String(email ?? '').toLowerCase().trim();

  if (!normalizedEmail || !password || !fullName || !licenseNumber || !hospitalAffiliation || !signatureText) {
    return json(res, 400, { error: 'Missing required registration fields' });
  }

  try {
    const supabase = createServiceClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: String(password),
      email_confirm: true,
      app_metadata: { role: 'vet' },
    });

    if (authError || !authData.user) {
      return json(res, 409, { error: authError?.message ?? 'Failed to create user' });
    }

    const now = new Date().toISOString();
    const { error: profileError } = await supabase.from('veterinarians').insert({
      full_name: fullName,
      email: normalizedEmail,
      phone: phone || null,
      password_hash: 'supabase-managed',
      license_number: licenseNumber,
      hospital_affiliation: hospitalAffiliation,
      tc_accepted: true,
      tc_accepted_at: (consentPrintedAt as string) ?? now,
      signature_text: signatureText,
      consent_printed_at: (consentPrintedAt as string) ?? null,
      verification_status: 'pending',
      created_at: now,
      updated_at: now,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return json(res, 500, { error: `Failed to create veterinarian profile: ${profileError.message}` });
    }

    return json(res, 201, {
      id: authData.user.id,
      email: normalizedEmail,
      verification_status: 'pending',
    });
  } catch (err) {
    console.error('Dev register error:', err);
    return json(res, 500, { error: err instanceof Error ? err.message : 'Internal server error' });
  }
}

async function handleUploadRoute(req: http.IncomingMessage, res: http.ServerResponse) {
  const token = getBearerToken(req);
  if (!token) {
    return json(res, 401, { error: 'Missing authorization header' });
  }

  try {
    const supabase = createServiceClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return json(res, 401, { error: 'Invalid or expired token' });
    }

    const { fields, files } = await parseMultipart(req);
    const file = files.find((f) => f.fieldname === 'file');
    if (!file) {
      return json(res, 400, { error: 'No file field named "file" found' });
    }

    const category = fields.category;
    if (!isUploadCategory(category)) {
      return json(res, 400, { error: `Invalid or missing category: ${category}` });
    }

    if (!fields.entityType || !fields.entityId) {
      return json(res, 400, { error: 'Missing entityType or entityId' });
    }

    const result = await handleUpload({
      user: userData.user,
      category,
      entityType: fields.entityType,
      entityId: fields.entityId,
      file,
    });

    return json(res, 200, result);
  } catch (err) {
    console.error('Dev upload error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Forbidden' || message.includes('not allowed') ? 403 : 500;
    return json(res, status, { error: message });
  }
}

async function handleDownloadRoute(req: http.IncomingMessage, res: http.ServerResponse) {
  const token = getBearerToken(req);
  if (!token) {
    return json(res, 401, { error: 'Missing authorization header' });
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const path = url.searchParams.get('path');
  if (!path) {
    return json(res, 400, { error: 'Missing path query parameter' });
  }

  try {
    const supabase = createServiceClient();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      return json(res, 401, { error: 'Invalid or expired token' });
    }

    const result = await handleDownload({ user: userData.user, path });
    return json(res, 200, result);
  } catch (err) {
    console.error('Dev download error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message === 'Forbidden' ? 403 : 500;
    return json(res, status, { error: message });
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url ?? '/';

  if (url.startsWith('/api/register') && req.method === 'POST') {
    return handleRegister(req, res);
  }

  if (url.startsWith('/api/upload') && req.method === 'POST') {
    return handleUploadRoute(req, res);
  }

  if (url.startsWith('/api/download') && req.method === 'GET') {
    return handleDownloadRoute(req, res);
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Dev API server listening on http://localhost:${PORT}`);
});
