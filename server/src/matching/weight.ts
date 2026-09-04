import type { ComparableField } from '../../../shared/types';

// Thresholds for field comparison verdicts
export const MATCH_THRESHOLD = 0.92;
export const PARTIAL_THRESHOLD = 0.6;

// Weight values for compounding FieldComparison scores for a PairMatchResult
export const FIELD_WEIGHTS: Record<ComparableField, number> = {
  email: 0.30, phone: 0.25, birthDate: 0.20, lastName: 0.12, firstName: 0.08, city: 0.05,
};