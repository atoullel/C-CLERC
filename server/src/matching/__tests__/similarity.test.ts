import { alignNames, emailSimilarity, exactSimilarity, verdictFor } from '../similarity';
import { describe, it, expect } from 'vitest';

describe('verdictFor', () => {
  it('returns "match" at and above the match threshold', () => {
    expect(verdictFor(1)).toBe('match');
    expect(verdictFor(0.92)).toBe('match');
  });

  it('returns "partial" just below the match threshold, down to the partial threshold', () => {
    expect(verdictFor(0.91)).toBe('partial');
    expect(verdictFor(0.6)).toBe('partial');
  });

  it('returns "mismatch" below the partial threshold', () => {
    expect(verdictFor(0.59)).toBe('mismatch');
    expect(verdictFor(0)).toBe('mismatch');
  });
});

describe('exactSimilarity', () => {
  it('returns 1 for identical strings and 0 otherwise', () => {
    expect(exactSimilarity('paris', 'paris')).toBe(1);
    expect(exactSimilarity('paris', 'lyon')).toBe(0);
  });
});

describe('emailSimilarity', () => {
  it('returns 1 for an exact match', () => {
    expect(emailSimilarity('jean.dupont@example.com', 'jean.dupont@example.com')).toBe(1);
  });

  it('tolerates a local-part typo when the domain matches exactly', () => {
    const sim = emailSimilarity('j.dupont@example.com', 'jdupont@example.com');
    expect(sim).toBeGreaterThan(0.9);
    expect(sim).toBeLessThan(1);
  });

  it('returns 0 when domains differ, even with an identical local part', () => {
    expect(emailSimilarity('jean@example.com', 'jean@other.com')).toBe(0);
  });

  it('returns 0 for an address with no "@" at all', () => {
    expect(emailSimilarity('not-an-email', 'jean@example.com')).toBe(0);
  });

  it('splits on the LAST "@", so a truncated-domain false match is not possible', () => {
    expect(emailSimilarity('jean@corp@example.com', 'marie@corp@otherexample.com')).toBe(0);
  });

  it('still scores the local part correctly when both sides share a same real domain past multiple "@"s', () => {
    const sim = emailSimilarity('jean.dupont@corp@example.com', 'j.dupont@corp@example.com');
    expect(sim).toBeGreaterThan(0.8);
    expect(sim).toBeLessThan(1);
  });
});

describe('alignNames — direct (non-swapped) pairing', () => {
  it('scores a straightforward same-order match as 1/1, matched against the same field', () => {
    const result = alignNames('camille', 'petit', 'camille', 'petit');
    expect(result.swapped).toBe(false);
    expect(result.firstName).toEqual({ similarity: 1, matchedField: 'firstName' });
    expect(result.lastName).toEqual({ similarity: 1, matchedField: 'lastName' });
  });

  it('treats both-sides-missing as no evidence, not a mismatch', () => {
    const result = alignNames(null, null, null, null);
    expect(result.swapped).toBe(false);
    expect(result.firstName.matchedField).toBeNull();
    expect(result.lastName.matchedField).toBeNull();
  });
});

describe('alignNames — swap tolerance', () => {
  it('detects a fully swapped pairing (c023/c024-style column inversion)', () => {
    const result = alignNames('camille', 'petit', 'petit', 'camille');
    expect(result.swapped).toBe(true);
    expect(result.firstName).toEqual({ similarity: 1, matchedField: 'lastName' });
    expect(result.lastName).toEqual({ similarity: 1, matchedField: 'firstName' });
  });

  it('does NOT swap on a single coincidental field match with no corroboration', () => {
    const result = alignNames('jean', null, 'paul', 'jean');
    expect(result.swapped).toBe(false);
    expect(result.firstName.matchedField).toBe('firstName');
    expect(result.firstName.similarity).toBeLessThan(1);
    expect(result.lastName.matchedField).toBeNull();
  });

  it('DOES swap when the swapped reading is strictly more informative than the direct one', () => {
    const result = alignNames('marie', null, null, 'marie');
    expect(result.swapped).toBe(true);
    expect(result.firstName).toEqual({ similarity: 1, matchedField: 'lastName' });
    expect(result.lastName.matchedField).toBeNull();
  });
});

describe('alignNames — initials', () => {
  it('scores a single-letter initial against a full name as a capped partial match', () => {
    const result = alignNames('c', 'petit', 'camille', 'petit');
    expect(result.firstName.similarity).toBe(0.75);
    expect(result.firstName.matchedField).toBe('firstName');
  });

  it('scores multi-letter initials against a hyphenated full name higher than a single-letter initial', () => {
    const result = alignNames('jp', 'martin', 'jean-pierre', 'martin');
    expect(result.firstName.similarity).toBe(0.8);
    expect(result.firstName.matchedField).toBe('firstName');
  });
});