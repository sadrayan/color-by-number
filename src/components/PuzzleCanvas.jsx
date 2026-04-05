import { useRef, useEffect, useCallback } from 'react';

/**
 * Renders the puzzle grid onto a <canvas> and dispatches fill/erase events.
 * All drawing is done imperatively via useEffect — React only manages the ref.
 */
export default function PuzzleCanvas({ puzzle, filledCells, cellShape = 'square', showErrors = false, onFill, onErase }) {
  const canvasRef  = useRef(null);
  const hoverRef   = useRef(null);
  const layoutRef  = useRef({ cellSize: 1 });

  // ── Layout ────────────────────────────────────────────────────────────────
  function computeLayout(canvas) {
    const container = canvas.parentElement;
    const maxW = container ? container.clientWidth  : window.innerWidth  - 32;
    const maxH = container ? container.clientHeight : window.innerHeight - 80;
    const available = Math.min(maxW, maxH, 700);
    const cellSize  = Math.max(Math.floor(available / Math.max(puzzle.width, puzzle.height)), 8);

    canvas.width  = cellSize * puzzle.width;
    canvas.height = cellSize * puzzle.height;
    layoutRef.current.cellSize = cellSize;
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  function draw(canvas, cells) {
    const ctx      = canvas.getContext('2d');
    const cellSize = layoutRef.current.cellSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isCircle = cellShape === 'circle';

    for (let row = 0; row < puzzle.height; row++) {
      for (let col = 0; col < puzzle.width; col++) {
        const colorNum = puzzle.grid[row][col];
        const x = col * cellSize;
        const y = row * cellSize;
        const filled = cells[`${row},${col}`] ?? null;
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;

        // Cell background (always fill the full square first)
        ctx.fillStyle = '#0d0d10';
        ctx.fillRect(x, y, cellSize, cellSize);

        if (isCircle) {
          if (colorNum === 0) continue; // background — leave dark, no circle

          const r = cellSize * 0.42;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);

          if (filled !== null) {
            ctx.fillStyle = puzzle.colors[String(filled)];
            ctx.fill();
          } else {
            ctx.strokeStyle = '#3a3a2a';
            ctx.lineWidth = Math.max(1, cellSize * 0.06);
            ctx.stroke();
            if (cellSize >= 14) {
              const fontSize = Math.max(Math.floor(cellSize * 0.38), 6);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign    = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle    = '#555566';
              ctx.fillText(String(colorNum), cx, cy);
            }
          }
        } else {
          // Square mode
          if (filled !== null) {
            ctx.fillStyle = puzzle.colors[String(filled)];
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = colorNum === 0 ? '#0d0d10' : '#16161c';
            ctx.fillRect(x, y, cellSize, cellSize);
            if (colorNum !== 0) {
              const fontSize = Math.max(Math.floor(cellSize * 0.45), 6);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textAlign    = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle    = '#555566';
              ctx.fillText(String(colorNum), cx, cy);
            }
          }
          ctx.strokeStyle = '#282820';
          ctx.lineWidth   = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
        }
      }
    }

    // Error highlight — second pass so it always renders on top
    if (showErrors) {
      for (let row = 0; row < puzzle.height; row++) {
        for (let col = 0; col < puzzle.width; col++) {
          const correct = puzzle.grid[row][col];
          if (correct === 0) continue;
          const filled = cells[`${row},${col}`] ?? null;
          if (filled === null || filled === correct) continue;

          const x  = col * cellSize;
          const y  = row * cellSize;
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          const pad = Math.max(cellSize * 0.18, 2);

          // Red tint overlay
          ctx.fillStyle = 'rgba(220,38,38,0.32)';
          if (isCircle) {
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }

          // X mark
          ctx.strokeStyle = 'rgba(255,80,80,0.95)';
          ctx.lineWidth   = Math.max(1.5, cellSize * 0.1);
          ctx.lineCap     = 'round';
          ctx.beginPath();
          ctx.moveTo(x + pad, y + pad);
          ctx.lineTo(x + cellSize - pad, y + cellSize - pad);
          ctx.moveTo(x + cellSize - pad, y + pad);
          ctx.lineTo(x + pad, y + cellSize - pad);
          ctx.stroke();
        }
      }
    }

    // Hover highlight
    const hover = hoverRef.current;
    if (hover) {
      const hx = hover.col * cellSize;
      const hy = hover.row * cellSize;
      const hcx = hx + cellSize / 2;
      const hcy = hy + cellSize / 2;
      ctx.strokeStyle = 'rgba(237,185,38,0.9)';
      ctx.lineWidth   = 2;
      if (isCircle) {
        ctx.beginPath();
        ctx.arc(hcx, hcy, cellSize * 0.44, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
      }
    }
  }

  // ── Hit-test helper ────────────────────────────────────────────────────────
  function eventToCell(canvas, e) {
    const rect    = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX  = canvas.width  / rect.width;
    const scaleY  = canvas.height / rect.height;
    const col     = Math.floor((clientX - rect.left) * scaleX / layoutRef.current.cellSize);
    const row     = Math.floor((clientY - rect.top)  * scaleY / layoutRef.current.cellSize);
    if (row < 0 || row >= puzzle.height || col < 0 || col >= puzzle.width) return null;
    return { row, col };
  }

  // ── Init & resize ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    computeLayout(canvas);
    draw(canvas, filledCells);

    function onResize() {
      computeLayout(canvas);
      draw(canvas, filledCells);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle]);

  // ── Redraw on state change ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) draw(canvas, filledCells);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCells, cellShape, showErrors]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleClick = useCallback((e) => {
    const cell = eventToCell(canvasRef.current, e);
    if (cell) onFill(cell.row, cell.col);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFill]);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const cell = eventToCell(canvasRef.current, e);
    if (cell) onErase(cell.row, cell.col);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onErase]);

  const handleMouseMove = useCallback((e) => {
    const cell = eventToCell(canvasRef.current, e);
    hoverRef.current = cell;
    draw(canvasRef.current, filledCells);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCells]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    draw(canvasRef.current, filledCells);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filledCells]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = e.changedTouches[0];
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const col = Math.floor((t.clientX - rect.left) * scaleX / layoutRef.current.cellSize);
    const row = Math.floor((t.clientY - rect.top)  * scaleY / layoutRef.current.cellSize);
    if (row >= 0 && row < puzzle.height && col >= 0 && col < puzzle.width) {
      onFill(row, col);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFill]);

  return (
    <canvas
      ref={canvasRef}
      style={{ cursor: 'crosshair', display: 'block', imageRendering: 'pixelated' }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
    />
  );
}
