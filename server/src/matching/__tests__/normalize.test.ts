import { normalizedFields } from '../normalize';
import { describe, it, expect } from 'vitest';
import type { Contact } from '../../../../shared/types';

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'test-id',
    source: 'crm',
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    birthDate: null,
    city: null,
    ...overrides,
  };
}

describe('normalizedFields — strings (firstName/lastName/city)', () => {
  it('lowercases and strips accents', () => {
    expect(normalizedFields(makeContact({ firstName: '  Émile  ' })).firstName).toBe('emile');
  });

  it('strips apostrophes', () => {
    expect(normalizedFields(makeContact({ lastName: "O'Brien" })).lastName).toBe('obrien');
  });

  it('strips the trailing period off an initial ("C." -> "c")', () => {
    expect(normalizedFields(makeContact({ firstName: 'C.' })).firstName).toBe('c');
  });

  it('keeps internal hyphens, since they carry real information for name matching', () => {
    expect(normalizedFields(makeContact({ firstName: 'Jean-Pierre' })).firstName).toBe('jean-pierre');
  });

  it('treats a whitespace-only value the same as missing (null), not empty string', () => {
    expect(normalizedFields(makeContact({ city: '   ' })).city).toBeNull();
  });

  it('passes through an actual null unchanged', () => {
    expect(normalizedFields(makeContact({ lastName: null })).lastName).toBeNull();
  });
});

describe('normalizedFields — email', () => {
  it('lowercases and trims', () => {
    expect(normalizedFields(makeContact({ email: '  Jane.Doe@Example.COM ' })).email).toBe(
      'jane.doe@example.com'
    );
  });

  it('treats a whitespace-only value as null', () => {
    expect(normalizedFields(makeContact({ email: '   ' })).email).toBeNull();
  });
});

describe('normalizedFields — phone', () => {
  it('normalizes a national-format FR number to E.164', () => {
    expect(normalizedFields(makeContact({ phone: '0612345678' })).phone).toBe('+33612345678');
  });

  it('normalizes a spaced international-format number to the same E.164 value', () => {
    expect(normalizedFields(makeContact({ phone: '+33 6 12 34 56 78' })).phone).toBe('+33612345678');
  });

  it('returns null for an unparseable phone rather than passing the raw string through', () => {
    expect(normalizedFields(makeContact({ phone: 'not-a-phone' })).phone).toBeNull();
  });

  it('returns null for a missing phone', () => {
    expect(normalizedFields(makeContact({ phone: null })).phone).toBeNull();
  });
});

describe('normalizedFields — birthDate', () => {
  it('keeps a CRM-source date (yyyy-MM-dd) as-is', () => {
    expect(
      normalizedFields(makeContact({ source: 'crm', birthDate: '1985-07-03' })).birthDate
    ).toBe('1985-07-03');
  });

  it('converts a partner-source date (dd/MM/yyyy) to canonical yyyy-MM-dd', () => {
    expect(
      normalizedFields(makeContact({ source: 'partenaire', birthDate: '03/07/1985' })).birthDate
    ).toBe('1985-07-03');
  });

  it('falls back to the partner format for a dirty CRM row (dd/MM/yyyy where yyyy-MM-dd was expected)', () => {
    expect(
      normalizedFields(makeContact({ source: 'crm', birthDate: '03/07/1985' })).birthDate
    ).toBe('1985-07-03');
  });

  it('falls back to the CRM format for a dirty partner row (yyyy-MM-dd where dd/MM/yyyy was expected)', () => {
    expect(
      normalizedFields(makeContact({ source: 'partenaire', birthDate: '1985-07-03' })).birthDate
    ).toBe('1985-07-03');
  });

  it('returns null for a calendar-invalid date (Feb 31) rather than guessing', () => {
    expect(
      normalizedFields(makeContact({ source: 'crm', birthDate: '31/02/2020' })).birthDate
    ).toBeNull();
  });

  it('returns null for unparseable garbage', () => {
    expect(
      normalizedFields(makeContact({ source: 'crm', birthDate: 'not-a-date' })).birthDate
    ).toBeNull();
  });

  it('returns null for a missing birthDate', () => {
    expect(normalizedFields(makeContact({ birthDate: null })).birthDate).toBeNull();
  });
});