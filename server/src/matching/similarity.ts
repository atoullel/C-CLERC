// server/src/matching/similarity.ts

import jaroWinkler from 'jaro-winkler';
import type { FieldComparison } from '../../../shared/types';
import {MATCH_THRESHOLD, PARTIAL_THRESHOLD} from 'weight.ts';


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

export function emailSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const [localA, domainA] = a.split('@');
  const [localB, domainB] = b.split('@');
  if (!domainA || !domainB || domainA !== domainB) return 0;
  return jaroWinkler(localA, localB);
}

// ---------------------------------------------------------------------
// Names (swap-tolerant, initial-aware)
// ---------------------------------------------------------------------

function nameTokenSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const isInitial = a.length === 1 || b.length === 1;
  if (isInitial) {
    const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
    return longer.startsWith(shorter) ? 0.75 : 0;
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

type NameFieldRow = {
  similarity: number;
  matchedField: 'firstName' | 'lastName' | null;
};

export type NameAlignment = {

  firstName: NameFieldRow;
  lastName: NameFieldRow;
  swapped: boolean;
};


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


  const useSwapped = swappedAvg > directAvg;

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