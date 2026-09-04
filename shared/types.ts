// shared/types.ts

export type Source = 'crm' | 'partenaire';

export type Contact = {
  id: string;
  source: Source;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  city: string | null;
  mergedInto?: string;
};


export type ComparableField = 'firstName' | 'lastName' | 'email' | 'phone' | 'birthDate' | 'city';

export type FieldComparison = {
  field: ComparableField;
  valueA: string | null;
  valueB: string | null;
  similarity: number;        // 0 (no relation) to 1 (identical after normalization)
  verdict: 'match' | 'partial' | 'mismatch' | 'missing';
  matchedFromField?: 'firstName' | 'lastName';
};

export type NameFieldRow = {
  similarity: number;
  matchedField: 'firstName' | 'lastName' | null;
};


export type NameAlignment = {
  firstName: NameFieldRow;
  lastName: NameFieldRow;
  swapped: boolean;
};


export type PairMatchResult = {
  contactIdA: string;
  contactIdB: string;
  score: number;              // overall confidence, 0-1
  breakdown: FieldComparison[];
  // true if a hard-override rule fired (large birth-date gap) capping the score
  overridden: boolean;
};

export type DuplicateGroupStatus = 'pending' | 'confirmed' | 'rejected';


export type DuplicateGroup = {
  /** Stable signature = sorted contact IDs joined, e.g. "c014|c015|c016"
   *  Used as the key for persisting confirm/reject decisions across reloads */
  id: string;
  contactIds: string[];
  score: number;               // aggregate confidence for the whole group
  pairMatches: PairMatchResult[];
  status: DuplicateGroupStatus;
};

// Body sent when the reviewer confirms a merge.
export type ConfirmMergePayload = {
  // Which contactId's values win for each field, or a manual override string.
  fieldResolutions: Record<ComparableField, { sourceContactId: string } | { manualValue: string | null }>;
};