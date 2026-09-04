import { compareFields } from '../compareFields';
import { describe, it, expect } from 'vitest';
import { compoundScore, scorePair } from '../scorePair';
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

describe('scorePair — full pairwise result', () => {
  it('scores a genuine duplicate (swapped name columns, everything else matching) near 1, not overridden', () => {
    const a = makeContact({
      id: 'a1',
      source: 'crm',
      firstName: 'Camille',
      lastName: 'Petit',
      email: 'camille.petit@example.com',
      phone: '0612345678',
      birthDate: '1990-05-06',
      city: 'Paris',
    });
    const b = makeContact({
      id: 'b1',
      source: 'partenaire',
      firstName: 'Petit',
      lastName: 'Camille',
      email: 'camille.petit@example.com',
      phone: '+33 6 12 34 56 78',
      birthDate: '06/05/1990',
      city: 'paris',
    });

    const result = scorePair(a, b);

    expect(result.contactIdA).toBe('a1');
    expect(result.contactIdB).toBe('b1');
    expect(result.overridden).toBe(false);
    expect(result.score).toBeCloseTo(1, 5);
    expect(result.breakdown).toHaveLength(6);

    const firstNameRow = result.breakdown.find((row) => row.field === 'firstName');
    expect(firstNameRow?.matchedFromField).toBe('lastName');
  });
});

describe('compoundScore — birth-date override', () => {
  it('caps the score when both birth dates are present and do not match, even with every other field matching', () => {
    const a = makeContact({ id: 'a2', firstName: 'Jean', lastName: 'Dupont', birthDate: '1980-01-01' });
    const b = makeContact({ id: 'b2', firstName: 'Jean', lastName: 'Dupont', birthDate: '1995-01-01' });

    const breakdown = compareFields(a, b);
    const result = compoundScore(breakdown);

    expect(result.overridden).toBe(true);
    expect(result.score).toBeLessThanOrEqual(0.3);

    const birthDateRow = breakdown.find((row) => row.field === 'birthDate');
    expect(birthDateRow?.verdict).toBe('mismatch');
  });

  it('does not fire the override when the birthDate is missing on both sides', () => {
    const a = makeContact({ id: 'a3', firstName: 'Jean', lastName: 'Dupont', birthDate: null });
    const b = makeContact({ id: 'b3', firstName: 'Jean', lastName: 'Dupont', birthDate: null });

    const breakdown = compareFields(a, b);
    const result = compoundScore(breakdown);

    expect(result.overridden).toBe(false);
    expect(result.score).toBeCloseTo(1, 5);
  });

  it('does not fire the override when birth dates match exactly', () => {
    const a = makeContact({ id: 'a4', firstName: 'Jean', lastName: 'Dupont', birthDate: '1980-01-01' });
    const b = makeContact({ id: 'b4', firstName: 'Jean', lastName: 'Dupont', birthDate: '1980-01-01' });

    const breakdown = compareFields(a, b);
    const result = compoundScore(breakdown);

    expect(result.overridden).toBe(false);
  });
});

describe('compoundScore — missing fields are neutral, not penalized', () => {
  it('does not lower the score just because most fields are unknown on both sides', () => {
    const a = makeContact({ id: 'a5', firstName: 'Jean', lastName: 'Dupont' });
    const b = makeContact({ id: 'b5', firstName: 'Jean', lastName: 'Dupont' });

    const breakdown = compareFields(a, b);
    const result = compoundScore(breakdown);

    expect(result.score).toBeCloseTo(1, 5);
  });

  it(
    'documents a known limitation: a single shared generic value can currently score 1.0 with no ' +
      'corroborating fields (e.g. a company-wide email address) — this is not yet guarded against ' +
      'and should be revisited if a minimum-evidence rule is added',
    () => {
      const a = makeContact({ id: 'a6', email: 'contact@cabinet-durand.fr' });
      const b = makeContact({ id: 'b6', email: 'contact@cabinet-durand.fr' });

      const breakdown = compareFields(a, b);
      const result = compoundScore(breakdown);

      expect(result.score).toBe(1);
    }
  );
});