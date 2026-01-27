import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ActionButtonDropdownOption, BbbPluginSdk, FloatingWindow } from 'bigbluebutton-html-plugin-sdk';
import { css } from 'styled-components';
import Pip from '../plugin-pip/component';
import { useVideoStreams } from '../plugin-pip/components/cameras/hooks';
import { useScreenshare } from '../plugin-pip/components/screenshare/hooks';
import FocusWarning from '../plugin-pip/components/warning/component';

const isPipSupported = 'documentPictureInPicture' in window;

const cssRules = css`
  * {
    box-sizing: border-box;
    min-width: 0;
  }

  *::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  *::-webkit-scrollbar-button {
    width: 0;
    height: 0;
  }
  *::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,.25);
    border: none;
    border-radius: 50px;
  }
  *::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,.5); }
  *::-webkit-scrollbar-thumb:active { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-track {
    background: rgba(0,0,0,.25);
    border: none;
    border-radius: 50px;
  }
  *::-webkit-scrollbar-track:hover { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-track:active { background: rgba(0,0,0,.25); }
  *::-webkit-scrollbar-corner { background: 0 0; }
  
  #videoWrapper {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }

  video {
    border-radius: 8px;
    border: 2px solid transparent;
  }

  video.talking {
    border-color: #3b82f6;
  }

  html {
    height: 100%;
    overflow: hidden;
  }

  body {
    font-family: 'Source Sans Pro', Arial, sans-serif;
    font-size: 1rem;
    background-color: #202020;
    height: 100%;
  }

  #pip-root {
    height: 100%;
  }

  .container {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .actions {
    padding: 0.5rem;
    width: 100%;
    display: flex;
    align-items: flex-end;

    .controls {
      background-color: #303030;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      border-radius: 0.75rem;
      flex-grow: 1;
      padding: 0.25rem;
      height: 100%;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }

  @font-face {
    font-family: 'bbb-icons';
    src: url('fonts/BbbIcons/bbb-icons.woff2?v=VERSION') format('woff2'),
    url('fonts/BbbIcons/bbb-icons.woff?v=VERSION') format('woff');
    font-weight: normal;
    font-style: normal;
  }

  *:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .media-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    line-height: normal;
    position: relative;
  }

  .media-btn:disabled {
    cursor: not-allowed;
  }

  .media-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .media-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px #ffffff;
  }

  .badge {
    position: absolute;
    right: -10%;
    top: -10%;
    border-radius: 50%;
    line-height: 1;
    padding: 2px;
    height: 1rem;
    width: 1rem;
    font-size: 0.65rem;
    display: grid;
    place-items: center;
    background-color: #DF2721;
  }

  .video {
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;
    position: relative;
  }

  .webcams {
    display: grid;
    gap: 6px;
  }

  .webcams video {
    width: 100%;
    height: 100%;
  }

  .pip-video-container {
    position: relative;
    display: flex;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  .cameras {
    padding: 0.5rem;
  }

  .screenshare {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;

    video {
      height: 100%;
      width: auto;
    }
  }

  .container:not(.has-webcams) .screenshare video {
    object-position: center;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 white;
    }
    70% {
      box-shadow: 0 0 0 0.5625rem transparent;
    }
    100% {
      box-shadow: 0 0 0 0 transparent;
    } 
  }

  .pulse {
    animation: pulse 1s ease-in infinite;
  }

  .pip-video-container .username {
    position: absolute;
    color: white;
    left: 0.25rem;
    bottom: 0.25rem;
    font-size: 65%;
    background-color: #111111CC;
    padding: 0.2rem;
    border-radius: 0.75rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 80%;
  }
`;

interface MainComponentProps {
  pluginUuid: string;
}

function MainComponent({ pluginUuid }: MainComponentProps): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const pipActiveRef = React.useRef(JSON.parse(localStorage.getItem('pip-plugin-active')));
  const pipWindowRef = React.useRef<Window | null>(null);
  const pipRootRef = React.useRef<ReactDOM.Root | null>(null);
  const hasMediaRef = React.useRef(false);
  const [pipActive, setPipActive] = React.useState<boolean>(JSON.parse(localStorage.getItem('pip-plugin-active')));
  const [showFocusWarning, setShowFocusWarning] = React.useState(false);
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);
  const hasWebcams = Boolean(webcams?.user_camera?.length);
  const hasScreenshare = Boolean(screenshare?.screenshare?.length);
  const hasMedia = hasScreenshare || hasWebcams;
  hasMediaRef.current = hasMedia;

  if (isPipSupported) {
    pluginApi.setActionButtonDropdownItems([
      new ActionButtonDropdownOption({
        allowed: true,
        icon: pipActive ? 'desktop_off' : 'desktop',
        label: pipActive ? 'Deactivate PiP Window' : 'Activate PiP Window',
        onClick: () => {
          pipActiveRef.current = !pipActiveRef.current;
          localStorage.setItem('pip-plugin-active', JSON.stringify(pipActiveRef.current));
          setPipActive(pipActiveRef.current);
        },
        tooltip: pipActive ? 'Deactivate PiP Window' : 'Activate PiP Window',
      }),
    ]);
  }

  React.useEffect(() => {
    const handler = async () => {
      if (isPipSupported && pipActiveRef.current && hasMediaRef.current && document.hidden) {
        try {
          // @ts-expect-error This web API may not be supported by all major browsers.
          const pipWindow = await documentPictureInPicture.requestWindow({
            height: 270,
            width: 480,
            preferInitialWindowPlacement: true,
          });

          pipWindowRef.current = pipWindow;

          const pipDiv = pipWindow.document.createElement('div');
          pipDiv.setAttribute('id', 'pip-root');
          pipWindow.document.body.append(pipDiv);
          const pipRoot = ReactDOM.createRoot(pipWindow.document.getElementById('pip-root'));
          pipRootRef.current = pipRoot;

          const handlePageHide = () => {
            pipRoot.unmount();
            window.focus();
          };

          pipWindow.addEventListener('pagehide', handlePageHide);

          const style = document.createElement('style');
          style.textContent = cssRules.toString();
          pipWindow.document.head.appendChild(style);

          const normalize = document.createElement('link');
          normalize.rel = 'stylesheet';
          normalize.type = 'text/css';
          normalize.href = 'stylesheets/normalize.css';
          pipWindow.document.head.appendChild(normalize);

          const icons = document.createElement('link');
          icons.rel = 'stylesheet';
          icons.type = 'text/css';
          icons.href = 'stylesheets/bbb-icons.css';
          pipWindow.document.head.appendChild(icons);

          const fonts = document.createElement('link');
          fonts.rel = 'stylesheet';
          fonts.type = 'text/css';
          fonts.href = 'stylesheets/bbb-icons.css';
          pipWindow.document.head.appendChild(fonts);

          pipRoot.render(
            <Pip
              pluginApi={pluginApi}
              pipWindow={pipWindow}
            />,
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
        }
      } else if (!document.hidden) {
        pipRootRef.current?.unmount();
        pipWindowRef.current?.close();
      }
    };

    document.addEventListener('visibilitychange', handler);

    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, []);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return undefined;

    function handleVisibilityChange() {
      setShowFocusWarning(!document.hidden);
    }

    function handleFocus() {
      setShowFocusWarning(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleFocus);
    };
  }, [pipActive]);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return;

    if (showFocusWarning) {
      const actionsButton = document.querySelector('[data-test="actionsButton"]');
      const rect = actionsButton.getBoundingClientRect();
      pluginApi.setFloatingWindows([
        new FloatingWindow({
          id: 'focus-warning',
          top: rect.top - 90,
          left: rect.left + (rect.width / 2) - 181,
          movable: true,
          backgroundColor: 'white',
          boxShadow: 'none',
          contentFunction: (element: HTMLElement) => {
            const root = ReactDOM.createRoot(element);
            root.render(<FocusWarning />);
            return root;
          },
        }),
      ]);
    } else {
      pluginApi.setFloatingWindows([]);
    }
  }, [showFocusWarning, pluginApi, pipActive]);

  return null;
}

export default MainComponent;
