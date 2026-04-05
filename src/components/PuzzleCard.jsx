import { useEffect, useRef } from 'react';

export default function PuzzleCard({ puzzle, onPlay }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = puzzle.width;
    canvas.height = puzzle.height;
    const ctx = canvas.getContext('2d');
    for (let r = 0; r < puzzle.height; r++) {
      for (let c = 0; c < puzzle.width; c++) {
        const num = puzzle.grid[r][c];
        ctx.fillStyle = num === 0 ? '#ffffff' : puzzle.colors[String(num)];
        ctx.fillRect(c, r, 1, 1);
      }
    }
  }, [puzzle]);

  return (
    <div className="puzzle-card">
      <canvas ref={canvasRef} className="puzzle-thumb" />
      <div className="puzzle-card-info">
        <span className="puzzle-name">{puzzle.title}</span>
        <span className="puzzle-size">{puzzle.width}×{puzzle.height}</span>
      </div>
      <button className="btn btn-primary btn-sm" onClick={() => onPlay(puzzle)}>
        Play
      </button>
    </div>
  );
}
