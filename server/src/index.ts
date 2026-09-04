import cors from 'cors';
import express from 'express';
import type { Contact } from '../../shared/types';
import contactsData from './data/contacts.json' with { type: 'json' };
import { generateAllPairMatches } from './matching/pairMatches';
import { clusterContacts } from './matching/cluster';

const contacts = contactsData as Contact[];

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3001);

app.get('/api/contacts', (_req, res) => {
  res.json(contacts.filter((c) => !c.mergedInto));
});

app.get('/api/duplicates', (_req, res) => {
  const pairMatches = generateAllPairMatches(contacts);
  const activeContacts = contacts.filter((c) => !c.mergedInto);
  const groups = clusterContacts(activeContacts, pairMatches);
  res.json(groups);
});

app.listen(PORT, () => {
  console.log(`API prête sur http://localhost:${PORT}`);
});