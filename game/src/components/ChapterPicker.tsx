import type { GameProgress, ChapterNumber } from '../types';
import './ChapterPicker.css';

interface ChapterPickerProps {
  progress: GameProgress;
  onSelectChapter: (chapter: ChapterNumber) => void;
}

function ChapterPicker({ progress, onSelectChapter }: ChapterPickerProps) {
  const chapters = [
    {
      number: 1 as ChapterNumber,
      title: 'The Princess\'s Bedroom',
      subtitle: 'Find the Five Magic Keys',
      image: 'art/title.jpg',
      available: true,
    },
    {
      number: 2 as ChapterNumber,
      title: 'The Rainbow Garden',
      subtitle: 'Restore the Garden\'s Colors',
      image: 'ch2/art/title-ch2.jpg',
      available: true,
    },
    {
      number: 3 as ChapterNumber,
      title: 'Coming Soon',
      subtitle: 'More adventures await!',
      image: 'art/title.jpg',
      available: false,
    },
    {
      number: 4 as ChapterNumber,
      title: 'Coming Soon',
      subtitle: 'More adventures await!',
      image: 'art/title.jpg',
      available: false,
    },
    {
      number: 5 as ChapterNumber,
      title: 'Coming Soon',
      subtitle: 'More adventures await!',
      image: 'art/title.jpg',
      available: false,
    },
  ];

  const isCompleted = (chapterNum: ChapterNumber) => {
    return progress.completedChapters.includes(chapterNum);
  };

  return (
    <div className="chapter-picker">
      <div className="chapter-picker-bg">
        <img src="art/title.jpg" alt="Background" />
      </div>
      <div className="chapter-picker-overlay">
        <div className="chapter-picker-content">
          <h1 className="picker-title">Choose Your Adventure</h1>
          <div className="chapters-grid">
            {chapters.map((chapter) => (
              <button
                key={chapter.number}
                className={`chapter-card ${!chapter.available ? 'locked' : ''} ${isCompleted(chapter.number) ? 'completed' : ''}`}
                onClick={() => chapter.available && onSelectChapter(chapter.number)}
                disabled={!chapter.available}
              >
                <div className="chapter-image">
                  <img src={chapter.image} alt={chapter.title} />
                  {!chapter.available && <div className="locked-overlay">🔒</div>}
                  {isCompleted(chapter.number) && chapter.available && (
                    <div className="completed-badge">✓</div>
                  )}
                </div>
                <div className="chapter-info">
                  <h2 className="chapter-number">Chapter {chapter.number}</h2>
                  <h3 className="chapter-title">{chapter.title}</h3>
                  <p className="chapter-subtitle">{chapter.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChapterPicker;
