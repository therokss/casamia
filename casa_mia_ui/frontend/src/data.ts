export type Card = { id: string; name: string; icon: string };
export type Screen = { id: string; name: string; icon: string; cards: Card[] };

// Schermate e card di esempio: per ora non sono collegate alle entità di Home Assistant.
export const SCREENS: Screen[] = [
  {
    id: 'home', name: 'Home', icon: '🏠',
    cards: [
      { id: 'luce-salotto', name: 'Luce Salotto', icon: '💡' },
      { id: 'temperatura', name: 'Temperatura', icon: '🌡️' },
      { id: 'luce-cucina', name: 'Luce Cucina', icon: '💡' },
    ],
  },
  {
    id: 'salotto', name: 'Salotto', icon: '🛋️',
    cards: [
      { id: 'luce-salotto', name: 'Luce Salotto', icon: '💡' },
      { id: 'tv', name: 'TV', icon: '📺' },
    ],
  },
  {
    id: 'cucina', name: 'Cucina', icon: '🍳',
    cards: [{ id: 'luce-cucina', name: 'Luce Cucina', icon: '💡' }],
  },
  {
    id: 'camera', name: 'Camera', icon: '🛏️',
    cards: [
      { id: 'luce-camera', name: 'Luce Camera', icon: '💡' },
      { id: 'temperatura-camera', name: 'Temperatura Camera', icon: '🌡️' },
    ],
  },
];

/**
 * Applica l'ordine salvato alle card della schermata, per id.
 * Le card nuove finiscono in fondo, quelle che non esistono più vengono ignorate:
 * aggiungere o togliere card non rompe mai il layout salvato.
 */
export function applyOrder(cards: Card[], saved: string[] | undefined): Card[] {
  if (!Array.isArray(saved)) return cards;
  const byId = new Map(cards.map((c) => [c.id, c]));
  const ordered: Card[] = [];
  for (const id of saved) {
    const c = byId.get(id);
    if (c) { ordered.push(c); byId.delete(id); }
  }
  return [...ordered, ...byId.values()];
}
