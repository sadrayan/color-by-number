import { useEffect, useState } from 'react';
import { usePuzzleGame } from '../hooks/usePuzzleGame.js';
import PuzzleCanvas from './PuzzleCanvas.jsx';
import Palette from './Palette.jsx';
import CompletionOverlay from './CompletionOverlay.jsx';

function loadCellShape() {
  return localStorage.getItem('cellShape') || 'square';
}

export default function PuzzleView({ puzzle, onBack }) {
  const [cellShape, setCellShape]     = useState(loadCellShape);
  const [showErrors, setShowErrors]   = useState(false);

  function handleShapeChange(shape) {
    setCellShape(shape);
    localStorage.setItem('cellShape', shape);
  }

  const {
    filledCells,
    selectedColor,
    setSelectedColor,
    fillCell,
    eraseCell,
    reset,
    progress,
    completed,
  } = usePuzzleGame(puzzle);

  // Auto-select first color on load
  useEffect(() => {
    const keys = Object.keys(puzzle.colors).map(Number).filter(n => n !== 0).sort((a, b) => a - b);
    if (keys.length > 0) setSelectedColor(keys[0]);
  }, [puzzle, setSelectedColor]);

  function handleReset() {
    if (window.confirm('Reset all progress for this puzzle?')) reset();
  }

  return (
    <div className="puzzle-page">
      <header className="puzzle-header">
        <button className="back-link" onClick={onBack}>← <span className="back-label">Gallery</span></button>
        <h1 className="puzzle-title">{puzzle.title}</h1>
        <div className="header-actions">
          <span className="progress-label">{Math.round(progress * 100)}%</span>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>Reset</button>
        </div>
      </header>

      <div className="puzzle-layout">
        <div className="canvas-wrapper">
          <PuzzleCanvas
            puzzle={puzzle}
            filledCells={filledCells}
            cellShape={cellShape}
            showErrors={showErrors}
            onFill={fillCell}
            onErase={eraseCell}
          />
        </div>

        <Palette
          puzzle={puzzle}
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
          cellShape={cellShape}
          onShapeChange={handleShapeChange}
          showErrors={showErrors}
          onToggleErrors={() => setShowErrors(v => !v)}
        />
      </div>

      {completed && (
        <CompletionOverlay
          puzzle={puzzle}
          filledCells={filledCells}
          onPlayAgain={reset}
          onBack={onBack}
        />
      )}
    </div>
  );
}
