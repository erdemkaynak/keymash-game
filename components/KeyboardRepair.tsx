import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { KEYBOARD_ROWS } from '../constants';

// --- Key Slot (Droppable) ---
interface KeySlotProps {
  char: string;
  placedChar: string | null;
}

const KeySlot: React.FC<KeySlotProps> = ({ char, placedChar }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${char}`,
    data: { char }
  });

  const isFilled = placedChar !== null;

  return (
    <div
      ref={setNodeRef}
      className={`
        w-10 h-10 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold text-xl
        border-2 transition-all duration-200
        ${isFilled 
          ? 'bg-white border-gray-300 text-gray-800 border-b-4 shadow-sm' 
          : isOver 
            ? 'bg-blue-100 border-fun-blue border-dashed' 
            : 'bg-gray-100 border-gray-200 text-gray-300 border-dashed'}
      `}
    >
      {isFilled ? placedChar : ''}
    </div>
  );
};

// --- Draggable Key ---
interface DraggableKeyProps {
  id: string;
  char: string;
}

const DraggableKey: React.FC<DraggableKeyProps> = ({ id, char }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { char }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  if (isDragging) {
    return <div ref={setNodeRef} className="w-10 h-10 md:w-14 md:h-14 opacity-50 bg-gray-300 rounded-lg" />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="
        w-10 h-10 md:w-14 md:h-14 rounded-lg flex items-center justify-center font-bold text-xl
        bg-white border-2 border-gray-300 border-b-4 text-gray-800 cursor-grab active:cursor-grabbing
        active:border-b-2 active:translate-y-1
        shadow-sm hover:bg-gray-50 transition-all touch-none
      "
    >
      {char}
    </div>
  );
};

interface KeyboardRepairProps {
  onComplete: () => void;
  onProgress: (percentage: number) => void;
}

export const KeyboardRepair: React.FC<KeyboardRepairProps> = ({ onComplete, onProgress }) => {
  const allKeys = KEYBOARD_ROWS.flat();
  // Changed to 0.85 (85% prefilled) - easier/shorter task
  const PREFILLED_PERCENTAGE = 0.85; 
  
  const [placedKeys, setPlacedKeys] = useState<Record<string, string>>({});
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const shuffled = [...allKeys].sort(() => Math.random() - 0.5);
    const totalCount = allKeys.length;
    const prefilledCount = Math.floor(totalCount * PREFILLED_PERCENTAGE);
    
    const prefilled = shuffled.slice(0, prefilledCount);
    const toPlay = shuffled.slice(prefilledCount);

    const initialPlaced: Record<string, string> = {};
    prefilled.forEach(key => {
      initialPlaced[key] = key;
    });

    setPlacedKeys(initialPlaced);
    setAvailableKeys(toPlay);

    const initialProgress = Math.round((prefilledCount / totalCount) * 100);
    onProgress(initialProgress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedChar = active.data.current?.char;
    const targetChar = over.data.current?.char;

    if (draggedChar === targetChar) {
      setPlacedKeys(prev => {
        const newPlaced = { ...prev, [targetChar]: draggedChar };
        
        const count = Object.keys(newPlaced).length;
        const total = allKeys.length;
        const progress = Math.round((count / total) * 100);
        onProgress(progress);
        
        if (count === total) {
          setTimeout(onComplete, 500);
        }
        
        return newPlaced;
      });

      setAvailableKeys(prev => prev.filter(k => k !== draggedChar));
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col items-center justify-center w-full h-full space-y-8 select-none">
        
        {/* Keyboard Grid */}
        <div className="flex flex-col gap-2 p-4 bg-gray-200/50 rounded-2xl border-2 border-gray-300">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1 md:gap-2">
              {row.map(char => (
                <KeySlot 
                  key={char} 
                  char={char} 
                  placedChar={placedKeys[char] || null} 
                />
              ))}
            </div>
          ))}
        </div>

        {/* Loose Keys Pool */}
        <div className="w-full max-w-4xl p-6 min-h-[120px] bg-blue-50/50 rounded-xl border-2 border-dashed border-blue-200 flex flex-wrap gap-2 justify-center items-center content-start transition-all">
          {availableKeys.map((char) => (
            <DraggableKey key={`key-${char}`} id={`key-${char}`} char={char} />
          ))}
          {availableKeys.length === 0 && (
            <div className="text-fun-green font-black text-2xl animate-bounce">
               TAMAMLANDI!
            </div>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl bg-fun-yellow border-2 border-yellow-500 border-b-4 text-black shadow-xl">
            {activeId.replace('key-', '')}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};