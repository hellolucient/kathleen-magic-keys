import './TreasureBar.css';

export type TreasureKey = 'petal' | 'gem' | 'light';

interface TreasureBarProps {
  treasures: { petal: boolean; gem: boolean; light: boolean };
  /** Chapter-relative asset base, e.g. 'ch3/art/sprites' or 'art/sprites' */
  spriteBase: string;
  petalSrc?: string;
  gemSrc?: string;
  lightSrc?: string;
}

const DEFAULTS: Record<TreasureKey, string> = {
  petal: 'rainbow-petal.png',
  gem: 'purple-gem.png',
  light: 'firefly.png',
};

function TreasureBar({ treasures, spriteBase, petalSrc, gemSrc, lightSrc }: TreasureBarProps) {
  const src = (key: TreasureKey) => {
    const file =
      key === 'petal' ? (petalSrc || DEFAULTS.petal) :
      key === 'gem' ? (gemSrc || DEFAULTS.gem) :
      (lightSrc || DEFAULTS.light);
    return `${spriteBase}/${file}`;
  };

  return (
    <div className="treasure-bar gold-frames" aria-label="Treasures collected">
      {(['petal', 'gem', 'light'] as TreasureKey[]).map((key) => (
        <div
          key={key}
          className={`treasure-slot gold-frame ${treasures[key] ? 'filled' : 'empty'}`}
          title={key}
        >
          {treasures[key] && (
            <img src={src(key)} alt={key} />
          )}
        </div>
      ))}
    </div>
  );
}

export default TreasureBar;
