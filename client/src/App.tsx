import { useEffect, useState } from 'react';
import type { Contact, DuplicateGroup } from '../../shared/types';
import { fetchContacts, fetchDuplicateGroups } from './api';
import { ContactsTable } from './components/ContactsTable';
import { DuplicatesView } from './components/DuplicatesView';

type Tab = 'contacts' | 'duplicates';

export default function App() {
  const [tab, setTab] = useState<Tab>('duplicates');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchContacts(), fetchDuplicateGroups()])
      .then(([c, g]) => {
        setContacts(c);
        setGroups(g);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      });
  }, []);

  return (
    <div className="page">
      <div className="masthead">
        <div>
          <p className="eyebrow">Contacts</p>
          <h1>Déduplication de contacts</h1>
        </div>
        <div>
          <button
            onClick={() => setTab('duplicates')}
            disabled={tab === 'duplicates'}
          >
            Doublons
          </button>{' '}
          <button onClick={() => setTab('contacts')} disabled={tab === 'contacts'}>
            Fiches ({contacts.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="alert">
          Impossible de charger les données.
          <p>{error}</p>
        </div>
      )}

      {!error && tab === 'contacts' && <ContactsTable contacts={contacts} />}
      {!error && tab === 'duplicates' && (
        <DuplicatesView groups={groups} contacts={contacts} />
      )}
    </div>
  );
}