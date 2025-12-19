import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../constants';

interface TypingRaceProps {
  words: string[];
  lang: 'EN' | 'TR';
  onComplete: (wpm: number) => void;
  onProgress: (progress: number) => void;
  playSound: (type: 'type' | 'error') => void;
}

export const TypingRace: React.FC<TypingRaceProps> = ({ words, lang, onComplete, onProgress, playSound }) => {
  // State
  const [currWordIndex, setCurrWordIndex] = useState(0);
  const [currInput, setCurrInput] = useState('');
  const [wordStatus, setWordStatus] = useState<('correct' | 'wrong' | 'pending')[]>([]);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [inputError, setInputError] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  const t = TRANSLATIONS[lang];

  // Initialize word statuses
  useEffect(() => {
    setWordStatus(new Array(words.length).fill('pending'));
  }, [words]);

  // Keep input focused
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    const handleClick = () => focusInput();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current && wordContainerRef.current) {
      const container = wordContainerRef.current;
      const element = activeWordRef.current;

      // Simple logic: maintain the active element relatively centered or at least visible
      const offsetTop = element.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollPosition = offsetTop - (containerHeight / 2) + (element.clientHeight / 2);

      container.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currWordIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Spacebar check
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent adding space to input

      if (currInput.trim().length === 0) {
        playSound('error');
        return;
      }

      const targetWord = words[currWordIndex];
      const isCorrect = currInput === targetWord;

      // Update status history
      const newStatus = [...wordStatus];
      newStatus[currWordIndex] = isCorrect ? 'correct' : 'wrong';
      setWordStatus(newStatus);

      // Move to next word
      setCurrWordIndex(prev => prev + 1);
      setCurrInput('');
      setInputError(false);

      // Calculate progress (words completed / total words)
      const progress = Math.round(((currWordIndex + 1) / words.length) * 100);
      onProgress(progress);

      // Calculate WPM
      if (startTime) {
        calculateWPM(currWordIndex + 1);
      }

      // Check if done (rare case if they finish 100 words)
      if (currWordIndex + 1 >= words.length) {
        onComplete(wpm);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Play type sound (throttled/trivial here)
    if (val.length > currInput.length) {
      playSound('type');
    }

    // Start timer on first char
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    setCurrInput(val);

    // Check for immediate error (prefix mismatch)
    const targetWord = words[currWordIndex];
    if (targetWord && !targetWord.startsWith(val)) {
      setInputError(true);
      playSound('error');
    } else {
      setInputError(false);
    }
  };

  const calculateWPM = (wordsTyped: number) => {
    const timeSpentMin = (Date.now() - (startTime || Date.now())) / 1000 / 60;
    if (timeSpentMin > 0) {
      setWpm(Math.round(wordsTyped / timeSpentMin));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl space-y-8 select-none">

      {/* Hidden Input to capture typing */}
      <input
        ref={inputRef}
        type="text"
        value={currInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="absolute opacity-0 pointer-events-none"
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Main Word Container */}
      <div className="relative w-full bg-white border-4 border-slate-200 rounded-3xl p-2 shadow-sm">
        {/* Header Bar inside box */}
        <div className="flex justify-between items-center px-6 py-4 border-b-2 border-gray-100 bg-gray-50/50 rounded-t-2xl mb-2">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.wpm}</span>
            <span className="text-3xl font-black text-fun-blue">{wpm}</span>
          </div>
          {/* Current Input Preview (Optional, for visual feedback) */}
          <div className={`h-10 px-4 flex items-center bg-white border-2 rounded-xl font-bold text-xl min-w-[100px] ${inputError ? 'border-red-400 text-red-500 bg-red-50' : 'border-gray-200 text-gray-700'}`}>
            {currInput}
          </div>
        </div>

        {/* Scrolling Words Area */}
        <div
          ref={wordContainerRef}
          className="relative h-[160px] overflow-hidden p-6 text-2xl md:text-3xl leading-relaxed flex flex-wrap content-start gap-x-4 gap-y-4 font-medium"
        >
          {words.map((word, idx) => {
            const isCurrent = idx === currWordIndex;
            const status = wordStatus[idx];

            // Styles based on status
            let classes = "px-2 py-1 rounded-lg transition-all duration-200";

            if (isCurrent) {
              // Active word style (Blue highlight like screenshot)
              classes += ` ${inputError ? 'bg-red-500' : 'bg-fun-blue'} text-white shadow-md transform scale-105`;
            } else if (status === 'correct') {
              classes += " text-fun-green opacity-50"; // Dim correct words
            } else if (status === 'wrong') {
              classes += " text-fun-red line-through opacity-60";
            } else {
              classes += " text-gray-400"; // Future words
            }

            return (
              <span
                key={idx}
                ref={isCurrent ? activeWordRef : null}
                className={classes}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Overlay Fade for bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-3xl"></div>
      </div>

    </div>
  );
};