import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../../utils/audio';
import { recordGameResult } from '../../utils/storage';

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateSudoku(cluesToRemove = 42): { puzzle: number[]; solution: number[]; fixed: boolean[] } {
  const grp = () => shuffle([0, 1, 2]).flatMap((g) => shuffle([0, 1, 2]).map((x) => g * 3 + x));
  const R = grp();
  const C = grp();
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const sol: number[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      sol.push(nums[(3 * (R[r] % 3) + Math.floor(R[r] / 3) + C[c]) % 9]);
    }
  }

  const puz = [...sol];
  const allIndices = shuffle(Array.from({ length: 81 }, (_, i) => i));
  const removeCount = Math.min(cluesToRemove, 54);

  for (let i = 0; i < removeCount; i++) {
    puz[allIndices[i]] = 0;
  }

  const fixed = puz.map((v) => v > 0);
  return { puzzle: puz, solution: sol, fixed };
}

interface SudokuGameProps {
  onRestart: () => void;
  gameKey: number;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onRestart, gameKey }) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [grid, setGrid] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [fixed, setFixed] = useState<boolean[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [isSolved, setIsSolved] = useState<boolean>(false);

  const cluesCount = difficulty === 'easy' ? 34 : difficulty === 'medium' ? 42 : 48;

  useEffect(() => {
    initPuzzle();
  }, [difficulty, gameKey]);

  const initPuzzle = () => {
    const { puzzle, solution: sol, fixed: fix } = generateSudoku(cluesCount);
    setGrid(puzzle);
    setSolution(sol);
    setFixed(fix);
    setSelectedIdx(-1);
    setIsSolved(false);
  };

  const isConflict = (idx: number, b: number[]): boolean => {
    const val = b[idx];
    if (!val) return false;
    const r = Math.floor(idx / 9);
    const c = idx % 9;

    for (let j = 0; j < 81; j++) {
      if (j === idx) continue;
      if (b[j] === val) {
        const jr = Math.floor(j / 9);
        const jc = j % 9;
        if (jr === r || jc === c) return true;
        if (Math.floor(jr / 3) === Math.floor(r / 3) && Math.floor(jc / 3) === Math.floor(c / 3)) {
          return true;
        }
      }
    }
    return false;
  };

  const checkCompletion = (b: number[]) => {
    if (b.includes(0)) return;
    const hasBad = b.some((_, i) => isConflict(i, b));
    if (!hasBad && !isSolved) {
      setIsSolved(true);
      sound.playSuccess();
      confetti({ particleCount: 90, spread: 75 });
      recordGameResult('sudoku', Math.floor(Date.now() / 1000) % 3600, `Completed ${difficulty} Sudoku`);
    }
  };

  const handleInputVal = (val: number) => {
    if (selectedIdx < 0 || fixed[selectedIdx] || isSolved) return;

    sound.playPop();
    const nextGrid = [...grid];
    nextGrid[selectedIdx] = val;
    setGrid(nextGrid);

    if (val > 0 && isConflict(selectedIdx, nextGrid)) {
      sound.playError();
    }

    checkCompletion(nextGrid);
  };

  // Keyboard navigation and number entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx < 0) return;
      if (/^[1-9]$/.test(e.key)) {
        handleInputVal(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleInputVal(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(0, prev - 9));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(80, prev + 9));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIdx((prev) => (prev % 9 > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIdx((prev) => (prev % 9 < 8 ? prev + 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, grid, fixed, isSolved]);

  const provideHint = () => {
    if (selectedIdx < 0 || fixed[selectedIdx] || isSolved) return;
    const correctVal = solution[selectedIdx];
    handleInputVal(correctVal);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Difficulty selector & Hint */}
      <div className="flex items-center justify-between w-full max-w-sm gap-2 mb-3">
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`py-1 px-3 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                difficulty === diff
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          onClick={provideHint}
          disabled={selectedIdx < 0 || fixed[selectedIdx] || isSolved}
          className="py-1 px-3 text-xs font-bold rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] text-slate-800 dark:text-white hover:border-blue-600 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
        >
          💡 Hint
        </button>
      </div>

      {/* 9x9 Board */}
      <div className="grid grid-cols-9 gap-0.5 sm:gap-1 p-2 bg-slate-800 dark:bg-slate-900 rounded-2xl max-w-[390px] w-full aspect-square border-2 border-slate-700 select-none shadow-md">
        {grid.map((val, idx) => {
          const r = Math.floor(idx / 9);
          const c = idx % 9;
          const isSelected = idx === selectedIdx;
          const isFix = fixed[idx];
          const hasConflict = isConflict(idx, grid);
          const isSameVal = selectedIdx >= 0 && grid[selectedIdx] > 0 && grid[selectedIdx] === val;

          // Thicker separators for 3x3 blocks
          const borderRightClass = c % 3 === 2 && c < 8 ? 'border-r-2 border-r-slate-400/60 dark:border-r-slate-500' : '';
          const borderBottomClass = r % 3 === 2 && r < 8 ? 'border-b-2 border-b-slate-400/60 dark:border-b-slate-500' : '';

          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedIdx(idx);
                sound.playPop();
              }}
              className={`aspect-square flex items-center justify-center font-black text-sm sm:text-base font-mono-nums transition-all cursor-pointer rounded-sm ${borderRightClass} ${borderBottomClass} ${
                isSelected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 z-10 scale-[1.06]'
                  : isSameVal
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100'
                  : isFix
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold'
                  : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold'
              } ${hasConflict ? '!text-rose-500 !bg-rose-50 ring-1 ring-rose-500' : ''}`}
            >
              {val > 0 ? val : ''}
            </button>
          );
        })}
      </div>

      {/* Number Pad for Mobile & Mouse */}
      <div className="grid grid-cols-10 gap-1.5 w-full max-w-[390px] mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleInputVal(num)}
            className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] font-black text-sm text-slate-900 dark:text-white hover:border-blue-600 hover:text-blue-600 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleInputVal(0)}
          className="py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] font-bold text-xs text-rose-500 hover:border-rose-400 active:scale-95 transition-all cursor-pointer"
          title="Erase cell"
        >
          ⌫
        </button>
      </div>

      {/* Status banner */}
      <div className="mt-3 text-center min-h-[3rem] flex flex-col items-center justify-center">
        {isSolved ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-black text-blue-600 dark:text-blue-400">
              🎉 Solved! Puzzle completed successfully!
            </p>
            <button
              onClick={initPuzzle}
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              Next Sudoku Grid ▶
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Use 1 to 9 once in each row, column, and 3x3 box. Red values indicate conflicts.
          </p>
        )}
      </div>
    </div>
  );
};
