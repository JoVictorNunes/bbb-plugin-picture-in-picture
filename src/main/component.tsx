import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ActionButtonDropdownOption, BbbPluginSdk, FloatingWindow } from 'bigbluebutton-html-plugin-sdk';
import Pip from '../plugin-pip/component';
import { useVideoStreams } from '../plugin-pip/components/cameras/hooks';
import { useScreenshare } from '../plugin-pip/components/screenshare/hooks';
import FocusWarning from '../plugin-pip/components/warning/component';
import { useCurrentUserVoice } from '../plugin-pip/components/actions/hooks';
import styles from './stylesheet';

const isPipSupported = 'documentPictureInPicture' in window;

interface MainComponentProps {
  pluginUuid: string;
}

function MainComponent({ pluginUuid }: MainComponentProps): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const pipActiveRef = React.useRef(JSON.parse(localStorage.getItem('pip-plugin-active')));
  const pipWindowRef = React.useRef<Window | null>(null);
  const hasMediaRef = React.useRef(false);
  const [pipActive, setPipActive] = React.useState<boolean>(JSON.parse(localStorage.getItem('pip-plugin-active')));
  const [showFocusWarning, setShowFocusWarning] = React.useState(false);
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);
  const hasWebcams = Boolean(webcams?.user_camera?.length);
  const hasScreenshare = Boolean(screenshare?.screenshare?.length);
  const hasMedia = hasScreenshare || hasWebcams;
  hasMediaRef.current = hasMedia;
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { joined: joinedVoice } = useCurrentUserVoice(pluginApi) || {};
  const amISharingWebcam = Boolean(currentUser?.cameras?.length);

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
    const startPipWindow = async () => {
      if (isPipSupported && pipActiveRef.current && hasMediaRef.current) {
        // @ts-expect-error This web API may not be supported by all major browsers.
        if (documentPictureInPicture.window) return false;

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

        const handlePageHide = () => {
          pipWindowRef.current = null;
          pipRoot.unmount();
        };

        pipWindow.addEventListener('pagehide', handlePageHide);

        const style = document.createElement('style');
        style.textContent = styles.toString();
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

        return true;
      }

      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // eslint-disable-next-line no-console
        startPipWindow().then((started) => { if (started) console.info('PiP window started by visibility change'); }).catch(console.warn);
      } else {
        pipWindowRef.current?.close();
      }
    };

    const handleEnterPip = () => {
      // eslint-disable-next-line no-console
      startPipWindow().then((started) => { if (started) console.info('PiP window started by PiP action'); }).catch(console.warn);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // @ts-expect-error This media action may not be supported by all major browsers.
    navigator.mediaSession.setActionHandler('enterpictureinpicture', handleEnterPip);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // @ts-expect-error This media action may not be supported by all major browsers.
      navigator.mediaSession.setActionHandler('enterpictureinpicture', null);
    };
  }, []);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return undefined;

    function handleVisibilityChange() {
      setShowFocusWarning(!document.hidden && !amISharingWebcam && !joinedVoice);
    }

    function handleFocus() {
      setShowFocusWarning(false);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleFocus, { capture: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleFocus, { capture: true });
    };
  }, [pipActive, amISharingWebcam, joinedVoice]);

  React.useEffect(() => {
    if (!isPipSupported || !pipActive) return undefined;

    if (showFocusWarning) {
      const actionsButton = document.querySelector('[data-test="actionsButton"]');
      const rect = actionsButton.getBoundingClientRect();
      pluginApi.setFloatingWindows([
        new FloatingWindow({
          id: 'focus-warning',
          top: rect.top - 90,
          left: rect.left + (rect.width / 2) - 181,
          movable: true,
          backgroundColor: 'transparent',
          boxShadow: 'none',
          contentFunction: (element: HTMLElement) => {
            const root = ReactDOM.createRoot(element);
            root.render(<FocusWarning />);
            return root;
          },
        }),
      ]);
    }

    return () => {
      pluginApi.setFloatingWindows([]);
    };
  }, [showFocusWarning, pluginApi, pipActive]);

  return null;
}

export default MainComponent;
