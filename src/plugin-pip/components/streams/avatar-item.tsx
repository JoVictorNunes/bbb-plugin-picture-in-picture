import * as React from 'react';

interface AvatarItemProps {
  userId: string;
  userName: string;
  avatar: string;
  color: string;
  userTalking: boolean;
}

function AvatarItem({
  userId, userName, avatar, color, userTalking,
}: AvatarItemProps) {
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

  const className = ['pip-video-container', 'pip-avatar-item'];
  if (userTalking) {
    className.push('talking');
  }

  return (
    <div
      key={userId}
      ref={updateRef}
      className={className.join(' ')}
      style={{ '--avatar-color': color } as React.CSSProperties}
    >
      {avatar ? (
        <img src={avatar} alt={userName} />
      ) : (
        <div className="pip-avatar-circle" style={{ backgroundColor: color }}>
          {userName?.charAt(0)}
        </div>
      )}
      {!squeezed && (
        <span className="username">
          {userName}
        </span>
      )}
    </div>
  );
}

export default AvatarItem;
