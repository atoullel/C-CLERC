import type { Contact } from '../../../shared/types';

export function ContactsTable({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return <p className="empty">Aucune fiche chargée.</p>;
  }

  return (
    <table className="contacts-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Source</th>
          <th>Prénom</th>
          <th>Nom</th>
          <th>Email</th>
          <th>Téléphone</th>
          <th>Naissance</th>
          <th>Ville</th>
        </tr>
      </thead>
      <tbody>
        {contacts.map((c) => (
          <tr key={c.id}>
            <td className="mono">{c.id}</td>
            <td>{c.source}</td>
            <td>{c.firstName ?? <span className="dim">—</span>}</td>
            <td>{c.lastName ?? <span className="dim">—</span>}</td>
            <td>{c.email ?? <span className="dim">—</span>}</td>
            <td>{c.phone ?? <span className="dim">—</span>}</td>
            <td>{c.birthDate ?? <span className="dim">—</span>}</td>
            <td>{c.city ?? <span className="dim">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}