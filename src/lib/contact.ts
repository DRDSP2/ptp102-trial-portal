export const SUPPORT_EMAIL = 'drsp@pm.me';

export function supportMailto(subject: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
