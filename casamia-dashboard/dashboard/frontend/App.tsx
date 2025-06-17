import { DndContext, useDraggable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';

const defaultCards = [
  { id: 'light', name: 'Luce Salotto' },
  { id: 'temp', name: 'Temperatura' },
];

function DraggableCard({ id, name, position, onPositionChange }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    top: position.y,
    left: position.x,
    position: 'absolute',
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="w-40 h-24 p-2 bg-white rounded-xl shadow-xl border cursor-move"
      style={style}
    >
      <h3 className="font-bold text-sm">{name}</h3>
      <p className="text-xs text-gray-500">ID: {id}</p>
    </div>
  );
}

export default function App() {
  const [positions, setPositions] = useState<{ [key: string]: { x: number; y: number } }>(() => {
    const saved = localStorage.getItem('card_positions');
    return saved ? JSON.parse(saved) : {
      light: { x: 40, y: 40 },
      temp: { x: 200, y: 40 },
    };
  });

  useEffect(() => {
    localStorage.setItem('card_positions', JSON.stringify(positions));
  }, [positions]);

  return (
    <div className="w-screen h-screen bg-gray-100">
      <DndContext
        onDragEnd={(event) => {
          const { delta, active } = event;
          const id = active.id as string;
          setPositions((prev) => {
            const prevPos = prev[id];
            return {
              ...prev,
              [id]: {
                x: prevPos.x + delta.x,
                y: prevPos.y + delta.y,
              },
            };
          });
        }}
      >
        {defaultCards.map((card) => (
          <DraggableCard
            key={card.id}
            id={card.id}
            name={card.name}
            position={positions[card.id]}
            onPositionChange={(pos: any) =>
              setPositions((prev) => ({ ...prev, [card.id]: pos }))
            }
          />
        ))}
      </DndContext>
    </div>
  );
}
