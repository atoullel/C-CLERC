import { useEffect, useState } from 'react';
import type { Contact } from '../../shared/types';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data) => setContacts(data as Contact[]));
  }, []);

  return (
    <div>
      <h1>Déduplication de contacts</h1>
      <p>{contacts.length} fiches chargées.</p>
    </div>
  );
}
