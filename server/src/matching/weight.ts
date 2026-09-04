 
import type { ComparableField } from '../../../shared/types';

// Thresholds for field comparison verdicts
export const MATCH_THRESHOLD = 0.92;
export const PARTIAL_THRESHOLD = 0.6;

// Scores for nameTokenSimilarity's short-token branch
export const INITIAL_PREFIX_SIMILARITY = 0.75;
export const INITIAL_MULTI_LETTER_SIMILARITY = 0.8;

export const MIN_SWAP_CORROBORATION_COUNT = 2;

// Weight values for compounding FieldComparison scores for a PairMatchResult
export const FIELD_WEIGHTS: Record<ComparableField, number> = {
  email: 0.30, phone: 0.25, birthDate: 0.20, lastName: 0.12, firstName: 0.08, city: 0.05,
};
// Score set when an override is done
export const OVERRIDE_SCORE_CAP = 0.3;



// Any group with a score above this deserve a human's attention
const REVIEW_THRESHOLD = 0.4;

// A pair scoring below this or overriden is treated two records that are not the same person
const CONTRADICTION_THRESHOLD = 0.15;