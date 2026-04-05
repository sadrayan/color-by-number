import { useState } from 'react';
import Gallery from './components/Gallery.jsx';
import PuzzleView from './components/PuzzleView.jsx';

export default function App() {
  const [activePuzzle, setActivePuzzle] = useState(null);

  if (activePuzzle) {
    return (
      <PuzzleView
        puzzle={activePuzzle}
        onBack={() => setActivePuzzle(null)}
      />
    );
  }

  return <Gallery onPlay={setActivePuzzle} />;
}
