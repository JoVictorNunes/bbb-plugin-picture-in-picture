import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import AudioButtonComponent from './buttons/audio/component';
import WebcamButtonComponent from './buttons/webcam/component';
import UnreadChatButtonComponent from './buttons/unread-chat/component';
import RaisedHandsButtonComponent from './buttons/raised-hands/component';
import UsersBadgeComponent from './buttons/users/component';
import LayoutButtonComponent from './buttons/layout/component';
import { useLayoutContext } from '../contexts/layout';

interface ActionsComponentProps {
  pluginApi: PluginApi;
  pipWindow: Window;
}

function ActionsComponent({ pluginApi, pipWindow }: ActionsComponentProps): React.ReactNode {
  const { actions } = useLayoutContext();
  return (
    <div
      className="actions"
      style={{
        position: 'absolute',
        left: actions.x,
        top: actions.y,
        width: actions.width,
        height: actions.height,
      }}
    >
      <div className="controls">
        <AudioButtonComponent pluginApi={pluginApi} />
        <WebcamButtonComponent pluginApi={pluginApi} />
        <UnreadChatButtonComponent pluginApi={pluginApi} pipWindow={pipWindow} />
        <RaisedHandsButtonComponent pluginApi={pluginApi} />
        <LayoutButtonComponent />
        <div
          style={{
            width: '1px',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.2)',
            margin: '0 4px',
            alignSelf: 'center',
            borderRadius: '6px',
          }}
        />
        <UsersBadgeComponent pluginApi={pluginApi} />
      </div>
    </div>
  );
}

export default ActionsComponent;
