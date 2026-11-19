import { useState, useEffect } from 'react';
import { audioManager } from '../audioManager';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onComplete: () => void;
}

function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Loading magical assets...');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      // Initialize audio
      await audioManager.init();
      setProgress(10);

      // Get all audio files to preload
      const soundEffects = [
        '/audio/sfx/celebration-fanfare.mp3',
        '/audio/sfx/curtain-swish.mp3',
        '/audio/sfx/door-glow-loop.mp3',
        '/audio/sfx/door-open-magic.mp3',
        '/audio/sfx/key-found.mp3',
        '/audio/sfx/kitten-meow-1.mp3',
        '/audio/sfx/kitten-meow-2.mp3',
        '/audio/sfx/lid-click.mp3',
        '/audio/sfx/lock-click.mp3',
        '/audio/sfx/music-box-loop.mp3',
        '/audio/sfx/sparkle.mp3',
        '/audio/sfx/star-1.mp3',
        '/audio/sfx/star-2.mp3',
        '/audio/sfx/star-3.mp3',
        '/audio/sfx/star-reset.mp3',
        '/audio/sfx/tap-pop.mp3',
        '/audio/sfx/wiggle-boing.mp3',
      ];

      setStatus('Loading sound effects...');
      await audioManager.preloadAudio(soundEffects);
      setProgress(40);

      // Preload images
      const images = [
        '/art/bg-bedroom.jpg',
        '/art/title.jpg',
        '/art/complete.jpg',
        '/art/sprites/curtain-closed-overlay.png',
        '/art/sprites/key.png',
        '/art/sprites/mirror-glow.png',
        '/art/sprites/star.png',
        '/art/sprites/jewellery-box-closed.png',
        '/art/sprites/jewellery-box-open.png',
        '/art/sprites/music-box.png',
        '/art/sprites/wardrobe-open.png',
        '/art/sprites/teddy.png',
        '/art/sprites/toy-chest-closed.png',
        '/art/sprites/toy-chest-open.png',
        '/art/sprites/dragon.png',
        '/art/sprites/kitten-sit.png',
        '/art/sprites/kitten-play.png',
        '/art/sprites/door-open-overlay.png',
        '/art/sprites/fairy-talk.png',
        '/art/sprites/fairy-cheer.png',
        '/art/sprites/kathleen.png',
        '/art/sprites/kathleen-cheer.png',
      ];

      setStatus('Loading beautiful artwork...');
      const imagePromises = images.map((src, index) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            setProgress(40 + Math.floor((index / images.length) * 50));
            resolve(true);
          };
          img.onerror = () => {
            console.warn(`Failed to load image: ${src}`);
            resolve(false);
          };
          img.src = src;
        });
      });

      await Promise.all(imagePromises);
      setProgress(95);

      setStatus('Almost ready...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress(100);
      setStatus('Ready!');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onComplete();
    } catch (error) {
      console.error('Loading error:', error);
      setStatus('Error loading. Tap to continue.');
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading-bg">
        <img src="/art/title.jpg" alt="" />
      </div>
      <div className="loading-overlay">
        <div className="loading-content">
          <h1 className="loading-title">Princess Kathleen</h1>
          <p className="loading-subtitle">and the Five Magic Keys</p>
          <div className="loading-bar-container">
            <div className="loading-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="loading-status">{status}</p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
