import en from './en.json';
import ml from './ml.json';

export type Locale = 'en' | 'ml';
export type Translations = typeof en;

const all: Record<Locale, Translations> = { en, ml };

function resolvePath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const value = resolvePath(all[locale], key);
  if (typeof value !== 'string') {
    const fallback = resolvePath(all.en, key);
    if (typeof fallback === 'string') {
      return interpolate(fallback, params);
    }
    return key;
  }
  return interpolate(value, params);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}
