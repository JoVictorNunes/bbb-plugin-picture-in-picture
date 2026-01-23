import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import AudioButtonComponent from './buttons/audio/component';
import WebcamButtonComponent from './buttons/webcam/component';
import UnreadChatButtonComponent from './buttons/unread-chat/component';
import RaisedHandsButtonComponent from './buttons/raised-hands/component';
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
        <RaisedHandsButtonComponent pluginApi={pluginApi} pipWindow={pipWindow} />
      </div>
    </div>
  );
}

export default ActionsComponent;
