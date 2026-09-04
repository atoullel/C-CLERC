import type { Contact, DuplicateGroup } from '../../../shared/types';
import { DuplicateCard } from './DuplicateCard';

export function DuplicatesView({
  groups,
  contacts,
}: {
  groups: DuplicateGroup[];
  contacts: Contact[];
}) {
  const contactsById = new Map(contacts.map((c) => [c.id, c]));

  const groupedIds = new Set(groups.flatMap((g) => g.contactIds));
  const singletons = contacts.filter((c) => !groupedIds.has(c.id));

  const autoCount = groups.filter((g) => g.score >= 0.9).length;
  const reviewCount = groups.length - autoCount;

  if (groups.length === 0) {
    return <p className="empty">Aucun doublon détecté sur ce jeu de données.</p>;
  }

  return (
    <>
      <div className="stats">
        <div className="stat stat--auto">
          <span className="stat__value">{autoCount}</span>
          <span className="stat__label">Correspondance forte</span>
        </div>
        <div className="stat stat--review">
          <span className="stat__value">{reviewCount}</span>
          <span className="stat__label">À vérifier</span>
        </div>
        <div className="stat">
          <span className="stat__value">{singletons.length}</span>
          <span className="stat__label">Sans doublon</span>
        </div>
      </div>

      <div className="groups">
        {groups.map((group) => (
          <DuplicateCard key={group.id} group={group} contactsById={contactsById} />
        ))}
      </div>

      {singletons.length > 0 && (
        <div className="singletons">
          <h2>Fiches sans doublon détecté</h2>
          <div className="chips">
            {singletons.map((c) => (
              <span className="chip" key={c.id}>
                {c.firstName ?? '—'} {c.lastName ?? '—'}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}