import './LookForPreview.css';

interface LookForPreviewProps {
  imageSrc: string;
  alt: string;
}

function LookForPreview({ imageSrc, alt }: LookForPreviewProps) {
  return (
    <div className="look-for-preview">
      <img src={imageSrc} alt={alt} />
    </div>
  );
}

export default LookForPreview;
