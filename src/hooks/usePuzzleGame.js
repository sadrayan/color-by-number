import { useState, useCallback, useMemo } from 'react';

function storageKey(puzzleId) {
  return `puzzle_${puzzleId}_progress`;
}

function loadProgress(puzzleId) {
  try {
    const saved = localStorage.getItem(storageKey(puzzleId));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress(puzzleId, filledCells) {
  try {
    localStorage.setItem(storageKey(puzzleId), JSON.stringify(filledCells));
  } catch { /* quota / private mode */ }
}

function clearProgress(puzzleId) {
  try {
    localStorage.removeItem(storageKey(puzzleId));
  } catch { /* ignore */ }
}

/**
 * Manages all game state for a color-by-number puzzle.
 *
 * @param {object} puzzle  - puzzle data object
 * @returns game state and actions
 */
export function usePuzzleGame(puzzle) {
  const [filledCells, setFilledCells] = useState(() => loadProgress(puzzle.id));
  const [selectedColor, setSelectedColor] = useState(null);

  // Total non-background cells
  const totalCells = useMemo(() => {
    let count = 0;
    for (const row of puzzle.grid) {
      for (const num of row) {
        if (num !== 0) count++;
      }
    }
    return count;
  }, [puzzle]);

  const filledCount = Object.keys(filledCells).length;
  const progress = totalCells === 0 ? 1 : filledCount / totalCells;

  const completed = useMemo(() => {
    if (filledCount < totalCells) return false;
    for (let row = 0; row < puzzle.height; row++) {
      for (let col = 0; col < puzzle.width; col++) {
        const correct = puzzle.grid[row][col];
        if (correct === 0) continue;
        if (filledCells[`${row},${col}`] !== correct) return false;
      }
    }
    return true;
  }, [filledCells, filledCount, totalCells, puzzle]);

  const fillCell = useCallback((row, col) => {
    if (selectedColor === null) return;
    const correct = puzzle.grid[row][col];
    if (correct === 0) return; // background cell

    setFilledCells(prev => {
      const next = { ...prev, [`${row},${col}`]: selectedColor };
      saveProgress(puzzle.id, next);
      return next;
    });
  }, [selectedColor, puzzle]);

  const eraseCell = useCallback((row, col) => {
    const key = `${row},${col}`;
    setFilledCells(prev => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      saveProgress(puzzle.id, next);
      return next;
    });
  }, [puzzle.id]);

  const reset = useCallback(() => {
    clearProgress(puzzle.id);
    setFilledCells({});
  }, [puzzle.id]);

  return {
    filledCells,
    selectedColor,
    setSelectedColor,
    fillCell,
    eraseCell,
    reset,
    progress,
    completed,
  };
}
