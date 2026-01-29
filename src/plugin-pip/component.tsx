import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import CamerasComponent from './components/cameras/component';
import ActionsComponent from './components/actions/component';
import ScreenshareComponent from './components/screenshare/component';
import ChatNotifier from './components/chat/notifier';
import RaisedHandNotifier from './components/raised-hands/component';
import { ToastProvider } from './components/ui/toast';
import { useVideoStreams } from './components/cameras/hooks';
import { useScreenshare } from './components/screenshare/hooks';
import { PipWindowProvider } from './components/contexts/pip-window';
import { LayoutProvider } from './components/contexts/layout';

interface PluginPipProps {
  pluginApi: PluginApi;
  pipWindow: Window;
}

function PluginPip({ pluginApi, pipWindow }: PluginPipProps): React.ReactNode {
  const { data: currentUser } = pluginApi.useCurrentUser();
  const { data: webcams } = useVideoStreams(pluginApi);
  const { data: screenshare } = useScreenshare(pluginApi);

  // Take undefined states into account in order to block UI rendering
  // until we know there are webcams/screenshare or not.
  const presenter = currentUser?.presenter;
  const moderator = currentUser?.role && currentUser.role === 'MODERATOR';
  const hasWebcams = webcams?.user_camera && Boolean(webcams?.user_camera.length);
  const hasScreenshare = screenshare?.screenshare && Boolean(screenshare?.screenshare.length);

  const containerClassName = ['container'];

  if (hasWebcams) containerClassName.push('has-webcams');
  if (hasScreenshare) containerClassName.push('has-screenshare');

  return (
    <PipWindowProvider pipWindow={pipWindow}>
      <LayoutProvider
        hasCameras={hasWebcams}
        hasScreenshare={hasScreenshare}
        presenter={presenter}
        moderator={moderator}
      >
        <ToastProvider>
          <div className={containerClassName.join(' ')}>
            <div className="video">
              <ScreenshareComponent pluginApi={pluginApi} />
              <CamerasComponent pluginApi={pluginApi} />
            </div>
            <ActionsComponent pluginApi={pluginApi} pipWindow={pipWindow} />
          </div>
          <ChatNotifier pluginApi={pluginApi} />
          {presenter && <RaisedHandNotifier pluginApi={pluginApi} />}
          <div id="modals-root" style={{ zIndex: 9999 }} />
        </ToastProvider>
      </LayoutProvider>
    </PipWindowProvider>
  );
}

export default PluginPip;
