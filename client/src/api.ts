import type { Contact, DuplicateGroup } from '../../shared/types';

export async function fetchContacts(): Promise<Contact[]> {
  const res = await fetch('/api/contacts');
  if (!res.ok) throw new Error(`GET /api/contacts failed: ${res.status}`);
  return res.json() as Promise<Contact[]>;
}

export async function fetchDuplicateGroups(): Promise<DuplicateGroup[]> {
  const res = await fetch('/api/duplicates');
  if (!res.ok) throw new Error(`GET /api/duplicates failed: ${res.status}`);
  return res.json() as Promise<DuplicateGroup[]>;
}