// server/src/matching/similarity.ts

import jaroWinkler from 'jaro-winkler';
import type { FieldComparison, NameAlignment } from '../../../shared/types';
import {
  MATCH_THRESHOLD,
  PARTIAL_THRESHOLD,
  INITIAL_PREFIX_SIMILARITY,
  INITIAL_MULTI_LETTER_SIMILARITY,
  MIN_SWAP_CORROBORATION_COUNT,
} from './weight';

// ---------------------------------------------------------------------
// Verdict thresholds
// ---------------------------------------------------------------------

export function verdictFor(
  similarity: number
): Exclude<FieldComparison['verdict'], 'missing'> {
  if (similarity >= MATCH_THRESHOLD) return 'match';
  if (similarity >= PARTIAL_THRESHOLD) return 'partial';
  return 'mismatch';
}

// ---------------------------------------------------------------------
// Exact-match fields (phone, birthDate, city)
// ---------------------------------------------------------------------

export function exactSimilarity(a: string, b: string): number {
  return a === b ? 1 : 0;
}

// ---------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}


export function emailSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const partsA = splitEmail(a);
  const partsB = splitEmail(b);
  if (!partsA || !partsB || partsA.domain !== partsB.domain) return 0;
  return jaroWinkler(partsA.local, partsB.local);
}

// ---------------------------------------------------------------------
// Names (swap-tolerant, initial-aware)
// ---------------------------------------------------------------------

// First letter of each space/hyphen-separated token, "jean-pierre" -> "jp".
function extractInitials(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter((token) => token.length > 0)
    .map((token) => token[0])
    .join('');
}


function nameTokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];

  if (shorter.length <= 2) {
    if (longer.startsWith(shorter)) return INITIAL_PREFIX_SIMILARITY;
    if (shorter.length >= 2 && extractInitials(longer) === shorter) return INITIAL_MULTI_LETTER_SIMILARITY;
    return 0;
  }

  return jaroWinkler(a, b);
}


function pairSimilarity(x: string | null, y: string | null): number | null {
  if (x === null || y === null || x.length === 0 || y.length === 0) return null;
  return nameTokenSimilarity(x, y);
}

function averageDefined(values: Array<number | null>): number {
  const defined = values.filter((v): v is number => v !== null);
  if (defined.length === 0) return 0;
  return defined.reduce((sum, v) => sum + v, 0) / defined.length;
}

function countDefined(values: Array<number | null>): number {
  return values.filter((v) => v !== null).length;
}


export function alignNames(
  aFirst: string | null,
  aLast: string | null,
  bFirst: string | null,
  bLast: string | null
): NameAlignment {
  const directFirst = pairSimilarity(aFirst, bFirst);
  const directLast = pairSimilarity(aLast, bLast);
  const swappedFirst = pairSimilarity(aFirst, bLast);
  const swappedLast = pairSimilarity(aLast, bFirst);

  const directAvg = averageDefined([directFirst, directLast]);
  const swappedAvg = averageDefined([swappedFirst, swappedLast]);
  const directCount = countDefined([directFirst, directLast]);
  const swappedCount = countDefined([swappedFirst, swappedLast]);


  const swapHasEnoughEvidence = swappedCount >= MIN_SWAP_CORROBORATION_COUNT || swappedCount > directCount;
  const useSwapped = swapHasEnoughEvidence && swappedAvg > directAvg;

  if (useSwapped) {
    return {
      firstName: {
        similarity: swappedFirst ?? 0,
        matchedField: swappedFirst === null ? null : 'lastName',
      },
      lastName: {
        similarity: swappedLast ?? 0,
        matchedField: swappedLast === null ? null : 'firstName',
      },
      swapped: true,
    };
  }

  return {
    firstName: {
      similarity: directFirst ?? 0,
      matchedField: directFirst === null ? null : 'firstName',
    },
    lastName: {
      similarity: directLast ?? 0,
      matchedField: directLast === null ? null : 'lastName',
    },
    swapped: false,
  };
}