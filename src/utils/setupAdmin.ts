import { hashPassword } from './passwordHash';

export async function getAdminPasswordHash(): Promise<string> {
  return hashPassword('PTP102');
}

export const ADMIN_EMAILS = ['drdsp@pm.me'];
