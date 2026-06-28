// Compute microservice API configuration.
// The Byrock FastAPI backend is a stateless compute service.
// In production and dev this is proxied through the frontend origin.

const DEFAULT_URL = import.meta.env.VITE_COMPUTE_API_URL || '/compute';

export const COMPUTE_API_BASE = DEFAULT_URL.replace(/\/$/, '');

export async function fetchAnalyze(landmarks: { name: string; x: number; y: number }[], pixelSpacing?: { x?: number; y?: number }) {
  const res = await fetch(`${COMPUTE_API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      landmarks,
      pixel_spacing_x: pixelSpacing?.x ?? null,
      pixel_spacing_y: pixelSpacing?.y ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`Compute failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function fetchNorms() {
  const res = await fetch(`${COMPUTE_API_BASE}/api/norms`);
  if (!res.ok) throw new Error('Failed to load norms');
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${COMPUTE_API_BASE}/api/health`);
  if (!res.ok) throw new Error('Compute health check failed');
  return res.json();
}
