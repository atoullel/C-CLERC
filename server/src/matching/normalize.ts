import { parse, isValid, format } from 'date-fns';
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import type { Contact, ComparableField } from '../../../shared/types';

export type NormalizedFields = Record<ComparableField, string | null>;

// ---------------------------------------------------------------------
// Strings (firstName, lastName, city)
// ---------------------------------------------------------------------


function normalizeString(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  return trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (é -> e, ç -> c)
    .toLowerCase()
    .replace(/[.'’]/g, '') // "C." / "O'Brien" -> "c" / "obrien"
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------

function normalizeEmail(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length === 0 ? null : trimmed;
}

// ---------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------


 // Parse with libphonenumber-js and re-emit in E.164

function normalizePhone(
  value: string | null,
  defaultCountry: CountryCode = 'FR'
): string | null {
  if (!value) return null;
  const phone = parsePhoneNumberFromString(value, defaultCountry);
  if (!phone || !phone.isValid()) {
    return null;
  }
  return phone.number; // E.164, e.g. +33612345678
}

// ---------------------------------------------------------------------
// Birth date
// ---------------------------------------------------------------------

const CRM_DATE_FORMAT = 'yyyy-MM-dd';
const PARTNER_DATE_FORMAT = 'dd/MM/yyyy';
const CANONICAL_DATE_FORMAT = 'yyyy-MM-dd';

function normalizeBirthDate(
  value: string | null,
  source: Contact['source']
): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const primary = source === 'crm' ? CRM_DATE_FORMAT : PARTNER_DATE_FORMAT;
  const fallback = source === 'crm' ? PARTNER_DATE_FORMAT : CRM_DATE_FORMAT;

  for (const fmt of [primary, fallback]) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, CANONICAL_DATE_FORMAT);
    }
  }
  return null;
}

// ---------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------

export function normalizedFields(contact: Contact): NormalizedFields {
  return {
    firstName: normalizeString(contact.firstName),
    lastName: normalizeString(contact.lastName),
    email: normalizeEmail(contact.email),
    phone: normalizePhone(contact.phone),
    birthDate: normalizeBirthDate(contact.birthDate, contact.source),
    city: normalizeString(contact.city),
  };
}