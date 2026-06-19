import { config } from 'dotenv';
config({ path: '.env.local' });

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
const E2E_STATE_TOKEN = process.env.E2E_BACKEND_STATE_TOKEN;

type E2EExpectedState = 'vet_pending' | 'vet_approved' | 'uploads_present' | 'product_moved';

const e2eExpectedStates = new Set<E2EExpectedState>([
  'vet_pending',
  'vet_approved',
  'uploads_present',
  'product_moved',
]);

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

function isE2EStateEndpointEnabled() {
  return (
    process.env.E2E_BACKEND_STATE_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    process.env.VERCEL_ENV !== 'production' &&
    Boolean(E2E_STATE_TOKEN)
  );
}

function hasE2EStateAccess(req: http.IncomingMessage) {
  const token = getBearerToken(req) ?? req.headers['x-e2e-state-token'];
  return typeof token === 'string' && Boolean(E2E_STATE_TOKEN) && token === E2E_STATE_TOKEN;
}

function tableMissing(error: { code?: string; message?: string } | null) {
  return error?.code === '42P01' || /relation .* does not exist/i.test(error?.message ?? '');
}

async function countRows(
  table: string,
  applyFilters: (query: ReturnType<ReturnType<typeof createServiceClient>['from']>['select']) => unknown,
) {
  const supabase = createServiceClient();
  const query = supabase.from(table).select('*', { count: 'exact', head: true });
  const { count, error } = (await applyFilters(query)) as { count: number | null; error: { message: string; code?: string } | null };
  if (error) {
    if (tableMissing(error)) return { count: 0, skipped: true, table };
    throw new Error(`${table} check failed: ${error.message}`);
  }
  return { count: count ?? 0, skipped: false, table };
}

async function handleE2EState(req: http.IncomingMessage, res: http.ServerResponse) {
  if (!isE2EStateEndpointEnabled()) {
    return json(res, 404, { error: 'Not found' });
  }

  if (!hasE2EStateAccess(req)) {
    return json(res, 401, { error: 'Missing or invalid E2E state token' });
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const expectedState = url.searchParams.get('expectedState') as E2EExpectedState | null;
  const vetEmail = url.searchParams.get('vetEmail')?.toLowerCase().trim();

  if (!expectedState || !e2eExpectedStates.has(expectedState)) {
    return json(res, 400, { error: 'Invalid expectedState' });
  }

  if (!vetEmail || !vetEmail.endsWith('@example.test')) {
    return json(res, 400, { error: 'vetEmail must be a disposable @example.test address' });
  }

  try {
    const supabase = createServiceClient();
    const { data: vet, error: vetError } = await supabase
      .from('veterinarians')
      .select('id,email,verification_status')
      .eq('email', vetEmail)
      .maybeSingle();

    if (vetError) {
      throw new Error(`veterinarians check failed: ${vetError.message}`);
    }

    const checks: Record<string, unknown> = { veterinarian: vet };
    let ok = Boolean(vet);

    if (expectedState === 'vet_pending') {
      ok = ok && vet?.verification_status === 'pending';
    }

    if (expectedState === 'vet_approved' || expectedState === 'uploads_present' || expectedState === 'product_moved') {
      ok = ok && vet?.verification_status === 'approved';
    }

    if (expectedState === 'uploads_present') {
      const userResponse = await supabase.auth.admin.listUsers();
      const user = userResponse.data.users.find((candidate) => candidate.email?.toLowerCase() === vetEmail);
      checks.authUserId = user?.id ?? null;

      const prefix = user ? `${user.id}/` : `${vetEmail}/`;
      const { data: storageObjects, error: storageError } = await supabase.storage.from('private-uploads').list(prefix, {
        limit: 10,
      });

      if (storageError) {
        throw new Error(`private-uploads check failed: ${storageError.message}`);
      }

      checks.privateUploads = storageObjects?.length ?? 0;
      ok = ok && (storageObjects?.length ?? 0) > 0;
    }

    if (expectedState === 'product_moved') {
      const targetOwner = url.searchParams.get('targetOwner') ?? process.env.E2E_TARGET_OWNER;
      const targetCategory = url.searchParams.get('targetCategory') ?? process.env.E2E_TARGET_CATEGORY;
      const shipmentChecks = await Promise.all([
        targetOwner
          ? countRows('ncie_shipment_log', (query) => query.eq('received_by_clinic_name', targetOwner))
          : Promise.resolve({ count: 0, skipped: true, table: 'ncie_shipment_log' }),
        targetCategory
          ? countRows('ncie_shipment_log', (query) => query.eq('shipment_status', targetCategory))
          : Promise.resolve({ count: 0, skipped: true, table: 'ncie_shipment_log' }),
      ]);
      checks.productMovement = shipmentChecks;
      ok = ok && shipmentChecks.some((check) => !check.skipped && check.count > 0);
    }

    return json(res, ok ? 200 : 409, { ok, expectedState, checks });
  } catch (err) {
    console.error('E2E state check error:', err);
    return json(res, 500, { error: err instanceof Error ? err.message : 'Internal server error' });
  }
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

  if (url.startsWith('/e2e/state') && req.method === 'GET') {
    return handleE2EState(req, res);
  }

  return json(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Dev API server listening on http://localhost:${PORT}`);
});
