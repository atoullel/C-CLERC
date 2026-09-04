import type { Contact, FieldComparison, PairMatchResult } from '../../../shared/types';
import { compareFields } from './compareFields';
import { FIELD_WEIGHTS, OVERRIDE_SCORE_CAP } from './weight';

function weightedAverage(breakdown: FieldComparison[]): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const row of breakdown) {
    if (row.verdict === 'missing') continue;
    weightedSum += FIELD_WEIGHTS[row.field] * row.similarity;
    weightTotal += FIELD_WEIGHTS[row.field];
  }
  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

export function compoundScore(breakdown: FieldComparison[]): { score: number; overridden: boolean } {
  const baseScore = weightedAverage(breakdown);

  const birthDateRow = breakdown.find((row) => row.field === 'birthDate');
  const overridden = birthDateRow?.verdict === 'mismatch';

  const score = overridden ? Math.min(baseScore, OVERRIDE_SCORE_CAP) : baseScore;
  return { score, overridden };
}

export function scorePair(a: Contact, b: Contact): PairMatchResult {
  const breakdown = compareFields(a, b);
  const { score, overridden } = compoundScore(breakdown);
  return {
    contactIdA: a.id,
    contactIdB: b.id,
    score,
    breakdown,
    overridden,
  };
}