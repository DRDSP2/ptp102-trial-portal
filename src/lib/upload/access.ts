import type { User } from '@supabase/supabase-js';
import { parseOwnerFromPath } from './path';

export function getUserRole(user: User): 'admin' | 'vet' | null {
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role === 'admin' || role === 'vet') {
    return role;
  }
  return null;
}

export function canAccessPath(user: User, path: string): boolean {
  const role = getUserRole(user);
  if (role === 'admin') {
    return true;
  }
  if (role === 'vet') {
    const ownerId = parseOwnerFromPath(path);
    return ownerId !== null && ownerId === user.id;
  }
  return false;
}
