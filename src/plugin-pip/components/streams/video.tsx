import * as React from 'react';

interface VideoProps {
  srcObject: MediaProvider;
  talking: boolean;
  /**
   * Called when the attached stream stops being able to deliver frames, so the
   * grid can resolve a fresh one. Without it a tile whose stream died keeps
   * rendering its last frame indefinitely: the element still reports a healthy
   * readyState and still reports itself as playing, so nothing else notices.
   */
  onStalled?: () => void;
}

function Video({ srcObject, talking, onStalled }: VideoProps) {
  const onStalledRef = React.useRef(onStalled);
  onStalledRef.current = onStalled;

  const attachVideo = React.useCallback((ref: HTMLVideoElement | null) => {
    if (ref) {
      // eslint-disable-next-line no-param-reassign
      ref.srcObject = srcObject;
    }
  }, [srcObject]);

  // Cleanup returned from a callback ref is only honoured by React 19, so the
  // listeners live in an effect instead - otherwise they would leak on every
  // stream change.
  React.useEffect(() => {
    if (!(srcObject instanceof MediaStream)) return undefined;

    const notify = () => onStalledRef.current?.();
    // On a remote WebRTC track 'mute' means media stopped arriving, and 'ended'
    // means the track is gone for good. Both are subscribed on transitions
    // only, so re-resolving to the same already-muted stream cannot loop.
    const tracks = srcObject.getVideoTracks();
    tracks.forEach((track) => {
      track.addEventListener('mute', notify);
      track.addEventListener('ended', notify);
    });

    return () => {
      tracks.forEach((track) => {
        track.removeEventListener('mute', notify);
        track.removeEventListener('ended', notify);
      });
    };
  }, [srcObject]);

  const className = [];

  if (talking) {
    className.push('talking');
  }

  return (
    <video
      autoPlay
      playsInline
      muted
      ref={attachVideo}
      className={className.join(' ')}
    />
  );
}

export default Video;
