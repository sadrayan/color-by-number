import { useState, useEffect } from 'react';
import PuzzleCard from './PuzzleCard.jsx';
import ImageImporter from './ImageImporter.jsx';

const DEMO_FILES = [
  '/puzzles/demo1.json',
  '/puzzles/demo2.json',
];

export default function Gallery({ onPlay }) {
  const [puzzles, setPuzzles] = useState([]);

  useEffect(() => {
    Promise.all(DEMO_FILES.map(f => fetch(f).then(r => r.json())))
      .then(setPuzzles)
      .catch(console.error);
  }, []);

  return (
    <div className="gallery-page">
      <header className="site-header">
        <h1>Color by Number</h1>
        <p className="subtitle">Pick a puzzle or create your own from an image</p>
      </header>

      <section className="gallery">
        <h2>Puzzles</h2>
        <div className="puzzle-grid">
          {puzzles.map(puzzle => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} onPlay={onPlay} />
          ))}
        </div>
      </section>

      <section className="import-section">
        <h2>Create from Image</h2>
        <ImageImporter onPlay={onPlay} />
      </section>
    </div>
  );
}
