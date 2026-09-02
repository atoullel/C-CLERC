export type Source = 'crm' | 'partenaire';

export type Contact = {
  id: string;
  source: Source;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  /** Format `AAAA-MM-JJ` côté crm, `JJ/MM/AAAA` côté partenaire. */
  birthDate: string | null;
  city: string | null;
};
