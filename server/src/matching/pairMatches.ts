import type { Contact, PairMatchResult } from '../../../shared/types';
import { scorePair } from './scorePair';

export function generateAllPairMatches(contacts: Contact[]): PairMatchResult[] {
  const active = contacts.filter((c) => !c.mergedInto);
  const results: PairMatchResult[] = [];

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      results.push(scorePair(active[i], active[j]));
    }
  }

  return results;
}