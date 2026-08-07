import * as React from 'react';
import Video from './video';

interface WebcamItemProps {
  streamId: string;
  srcObject: MediaStream;
  userTalking: boolean;
  userName: string;
  onStalled?: () => void;
}

function WebcamItem({
  streamId, srcObject, userTalking, userName, onStalled,
}: WebcamItemProps) {
  const [squeezed, setSqueezed] = React.useState(false);
  const observerRef = React.useRef<ResizeObserver | null>(null);

  const updateRef = React.useCallback((ref: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    if (ref) {
      observerRef.current = new ResizeObserver((entries) => {
        setSqueezed(entries[0] && entries[0].contentRect.width < 140);
      });

      observerRef.current.observe(ref);
    }
  }, []);

  return (
    <div key={streamId} ref={updateRef} className="pip-video-container">
      <Video srcObject={srcObject} talking={userTalking} onStalled={onStalled} />
      {!squeezed && (
        <span className="username">
          {userName}
        </span>
      )}
    </div>
  );
}

export default WebcamItem;
