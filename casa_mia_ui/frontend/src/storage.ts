// Tutte le chiavi hanno il prefisso "casamia:": sotto Ingress l'app gira
// sullo stesso origin di Home Assistant e ne condivide il localStorage.
const PREFIX = 'casamia:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage pieno o bloccato (navigazione privata): l'app continua a funzionare
  }
}
