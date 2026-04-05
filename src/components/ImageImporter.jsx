import { useState, useRef, useEffect } from 'react';
import { convertImageToPuzzle, downloadPuzzleJSON, ABSTRACTION_LEVELS } from '../services/image-converter.js';

function loadCellShape() {
  return localStorage.getItem('cellShape') || 'square';
}

function drawPreview(canvas, puzzle, cellShape) {
  const cellSize = Math.max(Math.floor(280 / puzzle.width), 3);
  canvas.width  = puzzle.width  * cellSize;
  canvas.height = puzzle.height * cellSize;
  const ctx = canvas.getContext('2d');

  for (let r = 0; r < puzzle.height; r++) {
    for (let c = 0; c < puzzle.width; c++) {
      const num = puzzle.grid[r][c];
      const x   = c * cellSize;
      const y   = r * cellSize;

      ctx.fillStyle = '#0d0d10';
      ctx.fillRect(x, y, cellSize, cellSize);

      if (num === 0) continue;

      const color = puzzle.colors[String(num)];
      if (cellShape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }
}

export default function ImageImporter({ onPlay }) {
  const [previewUrl, setPreviewUrl]       = useState(null);
  const [dragOver, setDragOver]           = useState(false);
  const [level, setLevel]                 = useState('medium');
  const [title, setTitle]                 = useState('');
  const [previewPuzzle, setPreviewPuzzle] = useState(null);
  const [previewing, setPreviewing]       = useState(false);
  const [converting, setConverting]       = useState(false);
  const [cellShape, setCellShape]         = useState(loadCellShape);

  const fileRef          = useRef(null);
  const inputRef         = useRef(null);
  const previewCanvasRef = useRef(null);
  const debounceRef      = useRef(null);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    fileRef.current = file;
    setPreviewPuzzle(null);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleCancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewPuzzle(null);
    setTitle('');
    fileRef.current = null;
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleShapeChange(shape) {
    setCellShape(shape);
    localStorage.setItem('cellShape', shape);
  }

  // Regenerate puzzle data when file or detail level changes
  useEffect(() => {
    if (!fileRef.current) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPreviewing(true);
      try {
        const { gridSize, numColors } = ABSTRACTION_LEVELS[level];
        const puzzle = await convertImageToPuzzle(fileRef.current, { gridSize, numColors, title: 'preview' });
        setPreviewPuzzle(puzzle);
      } catch (err) {
        console.error('Preview failed:', err);
      } finally {
        setPreviewing(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [previewUrl, level]);

  // Redraw whenever puzzle data or cell shape changes
  useEffect(() => {
    if (!previewPuzzle || !previewCanvasRef.current) return;
    drawPreview(previewCanvasRef.current, previewPuzzle, cellShape);
  }, [previewPuzzle, cellShape]);

  function handlePlay() {
    if (!previewPuzzle) return;
    onPlay({ ...previewPuzzle, id: `custom_${Date.now()}`, title: title.trim() || 'My Puzzle' });
  }

  function handleDownload() {
    if (!previewPuzzle) return;
    setConverting(true);
    try {
      downloadPuzzleJSON({ ...previewPuzzle, title: title.trim() || 'My Puzzle' });
    } finally {
      setConverting(false);
    }
  }

  const busy = previewing || converting;
  const colorEntries = previewPuzzle
    ? Object.entries(previewPuzzle.colors).filter(([k]) => k !== '0')
    : [];

  return (
    <div className="import-card">
      {!previewUrl ? (
        <div
          className={`drop-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <span className="drop-icon">🖼</span>
          <p>
            Drop an image here or{' '}
            <label className="file-link">
              browse
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={e => handleFile(e.target.files[0])}
              />
            </label>
          </p>
        </div>
      ) : (
        <div className="import-preview-layout">

          {/* ── Left: puzzle preview ── */}
          <div className="import-preview-main">
            <div className="preview-header">
              <p className="preview-label">Puzzle Preview</p>
              <div className="shape-toggle">
                <button
                  className={`shape-btn${cellShape === 'square' ? ' active' : ''}`}
                  onClick={() => handleShapeChange('square')}
                  title="Square cells"
                >
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                    <rect x="3" y="3" width="14" height="14" rx="2" />
                  </svg>
                </button>
                <button
                  className={`shape-btn${cellShape === 'circle' ? ' active' : ''}`}
                  onClick={() => handleShapeChange('circle')}
                  title="Circle cells"
                >
                  <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor">
                    <circle cx="10" cy="10" r="7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="preview-canvas-wrapper">
              {previewing && (
                <div className="preview-spinner">
                  <span className="spinner" />
                  Generating…
                </div>
              )}
              <canvas
                ref={previewCanvasRef}
                className="puzzle-preview-canvas"
                style={{ opacity: previewing ? 0 : 1 }}
              />
            </div>

            {colorEntries.length > 0 && (
              <div className="preview-palette">
                {colorEntries.map(([k, hex]) => (
                  <span
                    key={k}
                    className="preview-swatch"
                    style={{ background: hex }}
                    title={`Color ${k}`}
                  />
                ))}
                <span className="preview-palette-count">{colorEntries.length} colors</span>
              </div>
            )}
          </div>

          {/* ── Right: original + settings ── */}
          <div className="import-preview-sidebar">
            <div className="import-original-thumb">
              <img src={previewUrl} alt="original" />
              <span className="preview-label">Original</span>
            </div>

            <div className="options-form">
              <label>
                Title
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="My Puzzle"
                  maxLength={40}
                />
              </label>
              <label>
                Detail Level
                <select value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="low">Very Abstract (15×15, 6 colors)</option>
                  <option value="medium">Medium (25×25, 10 colors)</option>
                  <option value="high">Detailed (40×40, 16 colors)</option>
                </select>
              </label>
              <div className="import-actions">
                <button className="btn btn-primary" onClick={handlePlay} disabled={busy}>
                  Play Puzzle
                </button>
                <button className="btn btn-secondary" onClick={handleDownload} disabled={busy}>
                  Download JSON
                </button>
                <button className="btn btn-ghost" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
