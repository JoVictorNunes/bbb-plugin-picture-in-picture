import * as React from 'react';

interface VideoProps {
  srcObject: MediaProvider;
  talking: boolean;
}

function Video({ srcObject, talking }: VideoProps) {
  const attachVideo = React.useCallback((ref: HTMLVideoElement | null) => {
    if (ref) {
      // eslint-disable-next-line no-param-reassign
      ref.srcObject = srcObject;
    }
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
