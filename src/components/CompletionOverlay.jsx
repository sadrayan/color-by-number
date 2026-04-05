import { useEffect, useRef } from 'react';

export default function CompletionOverlay({ puzzle, filledCells, onPlayAgain, onBack }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = Math.min(puzzle.width, puzzle.height) <= 20 ? 8 : 5;
    canvas.width  = puzzle.width  * size;
    canvas.height = puzzle.height * size;
    const ctx = canvas.getContext('2d');

    for (let row = 0; row < puzzle.height; row++) {
      for (let col = 0; col < puzzle.width; col++) {
        const num = puzzle.grid[row][col];
        ctx.fillStyle = num === 0 ? '#0d0d10' : puzzle.colors[String(num)];
        ctx.fillRect(col * size, row * size, size, size);
      }
    }
  }, [puzzle, filledCells]);

  return (
    <div className="completion-overlay">
      <div className="completion-card">
        <div className="completion-icon">🎉</div>
        <h2>Puzzle Complete!</h2>
        <canvas ref={canvasRef} className="completion-preview" />
        <div className="completion-actions">
          <button className="btn btn-primary" onClick={onBack}>Back to Gallery</button>
          <button className="btn btn-secondary" onClick={onPlayAgain}>Play Again</button>
        </div>
      </div>
    </div>
  );
}
