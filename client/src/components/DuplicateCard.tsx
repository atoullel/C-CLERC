import type { Contact, DuplicateGroup, FieldComparison } from '../../../shared/types';

// Not exported from server/weight.ts today — picked to match the badge--auto
// / badge--review split in styles.css. Move this to a shared constant once
// weight.ts's thresholds are exposed to the client.
const AUTO_CONFIDENCE_THRESHOLD = 0.9;

const FIELD_LABELS: Record<FieldComparison['field'], string> = {
  firstName: 'Prénom',
  lastName: 'Nom',
  email: 'Email',
  phone: 'Téléphone',
  birthDate: 'Naissance',
  city: 'Ville',
};

function pctLabel(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function DuplicateCard({
  group,
  contactsById,
}: {
  group: DuplicateGroup;
  contactsById: Map<string, Contact>;
}) {
  const members = group.contactIds
    .map((id) => contactsById.get(id))
    .filter((c): c is Contact => c !== undefined);

  const isAuto = group.score >= AUTO_CONFIDENCE_THRESHOLD;

  return (
    <div className="group">
      <div className="group__head">
        <span className={`badge ${isAuto ? 'badge--auto' : 'badge--review'}`}>
          {isAuto ? 'Correspondance forte' : 'À vérifier'} · {pctLabel(group.score)}
        </span>
        <span className="group__count">{members.length} fiches</span>
      </div>

      <ul className="group__contacts">
        {members.map((c) => (
          <li key={c.id}>
            <span className="mono dim">{c.id}</span>
            <span className="name">
              {c.firstName ?? '—'} {c.lastName ?? '—'}
            </span>
            <span>{c.email ?? <span className="dim">—</span>}</span>
            <span>{c.phone ?? <span className="dim">—</span>}</span>
            <span className="dim">{c.city ?? '—'}</span>
          </li>
        ))}
      </ul>

      {group.pairMatches.map((pm) => (
        <details className="why" key={`${pm.contactIdA}-${pm.contactIdB}`}>
          <summary>
            <span>
              {pm.contactIdA} ↔ {pm.contactIdB}
              {pm.overridden && ' · écart bloquant'}
            </span>
            <span className="score">{pctLabel(pm.score)}</span>
          </summary>
          <table>
            <thead>
              <tr>
                <th>Champ</th>
                <th>{pm.contactIdA}</th>
                <th>{pm.contactIdB}</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {pm.breakdown.map((row) => (
                <tr key={row.field}>
                  <td>
                    {FIELD_LABELS[row.field]}
                    {row.matchedFromField && (
                      <span className="dim">
                        {' '}
                        (vs {FIELD_LABELS[row.matchedFromField]})
                      </span>
                    )}
                  </td>
                  <td>{row.valueA ?? <span className="dim">—</span>}</td>
                  <td>{row.valueB ?? <span className="dim">—</span>}</td>
                  <td className="mono">{row.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ))}
    </div>
  );
}