export default function Palette({ puzzle, selectedColor, onSelect, cellShape, onShapeChange, showErrors, onToggleErrors }) {
  const colorKeys = Object.keys(puzzle.colors)
    .map(Number)
    .filter(n => n !== 0)
    .sort((a, b) => a - b);

  return (
    <aside className="palette-sidebar">
      <h2 className="palette-title">Colors</h2>
      <div className="palette">
        {colorKeys.map(num => (
          <button
            key={num}
            className={`swatch${selectedColor === num ? ' selected' : ''}`}
            style={{ '--color': puzzle.colors[String(num)] }}
            title={`Color ${num}`}
            onClick={() => onSelect(num)}
          >
            <span className="swatch-num">{num}</span>
          </button>
        ))}
      </div>

      <div className="shape-toggle-section">
        <span className="palette-title">Cell Style</span>
        <div className="shape-toggle">
          <button
            className={`shape-btn${cellShape === 'square' ? ' active' : ''}`}
            onClick={() => onShapeChange('square')}
            title="Square cells"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <rect x="3" y="3" width="14" height="14" rx="2" />
            </svg>
          </button>
          <button
            className={`shape-btn${cellShape === 'circle' ? ' active' : ''}`}
            onClick={() => onShapeChange('circle')}
            title="Circle cells"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <circle cx="10" cy="10" r="7" />
            </svg>
          </button>
        </div>
      </div>

      <button
        className={`error-check-btn${showErrors ? ' active' : ''}`}
        onClick={onToggleErrors}
        title="Highlight wrong colors"
      >
        <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor">
          <path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4z"/>
        </svg>
        {showErrors ? 'Hide Errors' : 'Check Errors'}
      </button>

      <div className="palette-hint">
        <p>Left click — fill</p>
        <p>Right click — erase</p>
      </div>
    </aside>
  );
}
