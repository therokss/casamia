import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SCREENS, applyOrder, type Card } from './data';
import { load, save } from './storage';

const SCREEN_IDS = new Set(SCREENS.map((s) => s.id));

/** Schermata iniziale: prima l'indirizzo (#/salotto), poi l'ultima aperta, poi Home. */
function screenFromHash(): string | null {
  const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
  return SCREEN_IDS.has(id) ? id : null;
}

function initialScreen(): string {
  const fromHash = screenFromHash();
  if (fromHash) return fromHash;
  const last = load<string>('lastScreen', 'home');
  return SCREEN_IDS.has(last) ? last : 'home';
}

function CardView({ card, editing, dragging }: { card: Card; editing: boolean; dragging?: boolean }) {
  return (
    <div
      className={[
        'flex h-28 select-none gap-2 flex-col justify-between rounded-2xl border p-4',
        'bg-white border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800',
        'transition-[transform,box-shadow] duration-150 ease-out',
        editing ? 'cursor-grab outline-dashed outline-2 outline-offset-2 outline-blue-400/70' : 'active:scale-[0.97]',
        dragging ? 'cursor-grabbing shadow-xl scale-[1.03]' : '',
      ].join(' ')}
    >
      <span className="text-2xl leading-none" aria-hidden>{card.icon}</span>
      <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{card.name}</h3>
    </div>
  );
}

function SortableCard({ card, editing }: { card: Card; editing: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: !editing,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        // la card originale resta come "segnaposto" mentre si trascina la copia
        opacity: isDragging ? 0.35 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <CardView card={card} editing={editing} />
    </div>
  );
}

export default function App() {
  const [screenId, setScreenId] = useState(initialScreen);
  const [orders, setOrders] = useState(() => load<Record<string, string[]>>('order', {}));
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrolls = useRef(load<Record<string, number>>('scroll', {}));

  const screen = SCREENS.find((s) => s.id === screenId) ?? SCREENS[0];
  const cards = useMemo(() => applyOrder(screen.cards, orders[screen.id]), [screen, orders]);
  const activeCard = activeId ? cards.find((c) => c.id === activeId) : undefined;

  // Indirizzo sempre allineato alla schermata: il tasto indietro funziona e,
  // uscendo e rientrando, si riapre la stessa schermata.
  useEffect(() => {
    if (screenFromHash() !== screenId) history.replaceState(null, '', `#/${screenId}`);
    save('lastScreen', screenId);
  }, [screenId]);

  useEffect(() => {
    const onHash = () => {
      const id = screenFromHash();
      if (id) setScreenId(id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Posizione di scorrimento ricordata per ogni schermata.
  useLayoutEffect(() => {
    window.scrollTo(0, scrolls.current[screenId] ?? 0);
  }, [screenId]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scrolls.current[screenId] = Math.round(window.scrollY);
      });
    };
    const persist = () => save('scroll', scrolls.current);
    const onVisibility = () => document.visibilityState === 'hidden' && persist();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      persist();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [screenId]);

  // Esc chiude la modalità modifica.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !activeId && setEditing(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, activeId]);

  const go = useCallback((id: string) => {
    if (id === screenId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    scrolls.current[screenId] = Math.round(window.scrollY);
    location.hash = `/${id}`; // nuova voce di cronologia → hashchange → setScreenId
  }, [screenId]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // su touch serve una breve pressione: uno swipe veloce resta uno scorrimento
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const ids = cards.map((c) => c.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrders((prev) => {
      const updated = { ...prev, [screen.id]: next };
      save('order', updated);
      return updated;
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-gray-100/85 backdrop-blur dark:border-gray-800/70 dark:bg-[#0b0f17]/85">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h1 className="truncate text-xl font-bold">
            <span aria-hidden>{screen.icon}</span> {screen.name}
          </h1>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            className={[
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-100',
              editing
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-white text-gray-700 shadow-sm active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:active:bg-gray-700',
            ].join(' ')}
          >
            {editing ? 'Fatto' : 'Modifica'}
          </button>
        </div>
        <nav className="hidden gap-1 px-4 pb-3 sm:flex" aria-label="Stanze">
          {SCREENS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={s.id === screen.id ? 'page' : undefined}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-100',
                s.id === screen.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800',
              ].join(' ')}
            >
              <span aria-hidden>{s.icon}</span> {s.name}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4 sm:pb-8">
        {editing && (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Trascina le card per riordinarle (su telefono: tieni premuto e sposta).
          </p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={cards.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {cards.map((card) => (
                <SortableCard key={card.id} card={card} editing={editing} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 160, easing: 'ease-out' }}>
            {activeCard ? <CardView card={activeCard} editing dragging /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden dark:border-gray-800 dark:bg-gray-950/90"
        aria-label="Stanze"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {SCREENS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-current={s.id === screen.id ? 'page' : undefined}
              className={[
                'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-100 active:bg-gray-100 dark:active:bg-gray-900',
                s.id === screen.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400',
              ].join(' ')}
            >
              <span className="text-xl leading-none" aria-hidden>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
