import cors from 'cors';
import express from 'express';
import type { Contact } from '../../shared/types';
import contactsData from './data/contacts.json' with { type: 'json' };

const contacts = contactsData as Contact[];

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3001);

app.get('/api/contacts', (_req, res) => {
  res.json(contacts);
});

app.listen(PORT, () => {
  console.log(`API prête sur http://localhost:${PORT}`);
});
