import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import * as React from 'react';
import { useScreenshare } from './hooks';
import Video from './video';
import { useLayoutContext } from '../contexts/layout';

interface Media {
  srcObject: MediaProvider;
}

const pollForScreenshareSrc = (
  container: Element = document.body,
): Promise<Media> => new Promise((resolve, reject) => {
  const TIMEOUT = 5000; // 5 seconds
  const start = performance.now();

  const poll = () => {
    const timestamp: number = performance.now();
    const element = container.querySelector('#screenshareContainer video');
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve({ srcObject: element.srcObject });
    }
    if (timestamp - start > TIMEOUT) {
      return reject();
    }
    return setTimeout(poll);
  };

  setTimeout(poll);
});

interface ScreenshareComponentProps {
  pluginApi: PluginApi;
  // pipWindow: Window;
}

function ScreenshareComponent(
  { pluginApi }: ScreenshareComponentProps,
): React.ReactNode {
  const {
    data: screenshareData,
  } = useScreenshare(pluginApi);
  const [screenshare, setScreenshare] = React.useState<Media | null>(null);
  const { screenshare: screenshareRect } = useLayoutContext();

  React.useEffect(() => {
    async function update() {
      const isSharing = Boolean(screenshareData?.screenshare[0]?.stream);

      if (isSharing) {
        const src = await pollForScreenshareSrc();
        setScreenshare(src);
        return;
      }

      setScreenshare(null);
    }

    update();
  }, [screenshareData]);

  if (!screenshare) {
    return null;
  }

  return (
    <div
      className="screenshare"
      style={{
        position: 'absolute',
        left: screenshareRect.x,
        top: screenshareRect.y,
        width: screenshareRect.width,
        height: screenshareRect.height,
      }}
    >
      <Video
        key={screenshareData?.screenshare[0]?.stream}
        srcObject={screenshare.srcObject}
      />
    </div>
  );
}

export default ScreenshareComponent;
