// shared/matching/cluster.ts
import { Contact, PairMatchResult, DuplicateGroup } from '../types';
import { REVIEW_THRESHOLD, CONTRADICTION_THRESHOLD } from './weight';

class UnionFind {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root); // path compression
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

function isContradiction(pm: PairMatchResult): boolean {
  return pm.overridden || pm.score < CONTRADICTION_THRESHOLD;
}

export function clusterContacts(
  contacts: Contact[],
  pairMatches: PairMatchResult[],
): DuplicateGroup[] {
  const uf = new UnionFind();
  for (const c of contacts) uf.find(c.id);

  const contradictions = pairMatches.filter(isContradiction);

  const membersByRoot = new Map<string, Set<string>>();
  for (const c of contacts) membersByRoot.set(uf.find(c.id), new Set([c.id]));

  function hasContradictionBetween(rootA: string, rootB: string): boolean {
    const membersA = membersByRoot.get(rootA)!;
    const membersB = membersByRoot.get(rootB)!;
    return contradictions.some(
      pm =>
        (membersA.has(pm.contactIdA) && membersB.has(pm.contactIdB)) ||
        (membersA.has(pm.contactIdB) && membersB.has(pm.contactIdA)),
    );
  }

  const candidateEdges = pairMatches
    .filter(pm => pm.score >= REVIEW_THRESHOLD && !pm.overridden)
    .sort((a, b) => b.score - a.score);

  for (const pm of candidateEdges) {
    const rootA = uf.find(pm.contactIdA);
    const rootB = uf.find(pm.contactIdB);
    if (rootA === rootB) continue;

    if (hasContradictionBetween(rootA, rootB)) {
      continue;
    }

    uf.union(pm.contactIdA, pm.contactIdB);
    const newRoot = uf.find(pm.contactIdA);
    const oldRoot = newRoot === rootA ? rootB : rootA;
    const merged = new Set([...membersByRoot.get(rootA)!, ...membersByRoot.get(rootB)!]);
    membersByRoot.set(newRoot, merged);
    membersByRoot.delete(oldRoot);
  }

  // Group contact IDs by final root.
  const componentsByRoot = new Map<string, Set<string>>();
  for (const c of contacts) {
    const root = uf.find(c.id);
    if (!componentsByRoot.has(root)) componentsByRoot.set(root, new Set());
    componentsByRoot.get(root)!.add(c.id);
  }

  const groups: DuplicateGroup[] = [];
  for (const memberIds of componentsByRoot.values()) {
    if (memberIds.size < 2) continue; // singletons aren't a "duplicate group"

    const ids = [...memberIds].sort();

    const internalEdges = pairMatches.filter(
      pm => memberIds.has(pm.contactIdA) && memberIds.has(pm.contactIdB),
    );

    groups.push({
      id: ids.join('|'),
      contactIds: ids,
      pairMatches: internalEdges,
      score: aggregateGroupScore(internalEdges),
      status: 'pending',
    });
  }

  return groups;
}

function aggregateGroupScore(edges: PairMatchResult[]): number {
  if (edges.length === 0) return 0;

  const minScore = Math.min(...edges.map(e => e.score));

  const hasHardOverride = edges.some(e => e.overridden);
  return hasHardOverride ? Math.min(minScore, 0.3) : minScore;
}