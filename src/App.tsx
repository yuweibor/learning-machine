import React, { useEffect, useRef } from 'react';
import Game from './Game';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      gameRef.current = new Game(canvasRef.current);
      gameRef.current.start();
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="game-container">
      <div className="game-info">
        <h1 className="game-title">Card Game</h1>
        <p className="game-status">Game is running...</p>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="game-canvas"
      />
    </div>
  );
};

export default App;