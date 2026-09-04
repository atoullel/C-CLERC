import type { Contact, ComparableField, FieldComparison } from '../../../shared/types';
import { normalizedFields } from './normalize';
import { alignNames, emailSimilarity, exactSimilarity, verdictFor } from './similarity';
 
export function compareFields(a: Contact, b: Contact): FieldComparison[] {
  const na = normalizedFields(a);
  const nb = normalizedFields(b);
  const breakdown: FieldComparison[] = [];
 
  const alignment = alignNames(na.firstName, na.lastName, nb.firstName, nb.lastName);
  for (const field of ['firstName', 'lastName'] as const) {
    const row = alignment[field];
    if (row.matchedField === null) {
      breakdown.push({ field, valueA: a[field], valueB: b[field], similarity: 0, verdict: 'missing' });
    } else {
      breakdown.push({
        field,
        valueA: a[field],
        valueB: b[row.matchedField],
        similarity: row.similarity,
        verdict: verdictFor(row.similarity),
        matchedFromField: row.matchedField !== field ? row.matchedField : undefined,
      });
    }
  }
 
  push('email', a.email, b.email, na.email, nb.email, emailSimilarity);
  push('phone', a.phone, b.phone, na.phone, nb.phone, exactSimilarity);
  push('birthDate', a.birthDate, b.birthDate, na.birthDate, nb.birthDate, exactSimilarity);
  push('city', a.city, b.city, na.city, nb.city, exactSimilarity);
 
  function push(
    field: ComparableField,
    rawA: string | null,
    rawB: string | null,
    valA: string | null,
    valB: string | null,
    fn: (x: string, y: string) => number
  ) {
    if (valA === null || valB === null) {
      breakdown.push({ field, valueA: rawA, valueB: rawB, similarity: 0, verdict: 'missing' });
      return;
    }
    const sim = fn(valA, valB);
    breakdown.push({ field, valueA: rawA, valueB: rawB, similarity: sim, verdict: verdictFor(sim) });
  }
 
  return breakdown;
}