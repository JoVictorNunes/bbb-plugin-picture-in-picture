import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import Tooltip from '../../../ui/tooltip';
import { useCurrentUserVoice, useToggleVoice } from '../../hooks';

interface AudioButtonComponentProps {
  pluginApi: PluginApi;
}

function AudioButtonComponent({ pluginApi }: AudioButtonComponentProps) {
  const currentUser = pluginApi.useCurrentUser!();
  const currentUserVoice = useCurrentUserVoice(pluginApi);

  const toggleVoice = useToggleVoice(pluginApi);
  const noAudio = !currentUserVoice
    || currentUserVoice.listenOnly
    || currentUserVoice.listenOnlyInputDevice;

  const className = ['media-btn'];

  if (currentUserVoice?.talking) {
    className.push('pulse');
  }

  let title;

  if (noAudio) {
    title = 'No audio';
  } else if (currentUserVoice?.muted) {
    title = 'Unmute';
  } else {
    title = 'Mute';
  }

  return (
    <Tooltip content={title}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className={className.join(' ')}
          type="button"
          style={styles}
          disabled={noAudio}
          onClick={() => {
            if (currentUser && currentUser.data && !noAudio) {
              toggleVoice(currentUser.data.userId, !currentUserVoice.muted);
            }
          }}
        >
          <span className="sr-only">
            {currentUserVoice?.muted ? 'Unmute Me' : 'Mute Me'}
          </span>
          {noAudio ? (
            <i className="icon-bbb-no_audio" />
          ) : (
            <i className={`icon-bbb-${currentUserVoice?.muted ? 'mute' : 'unmute'}`} />
          )}
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default AudioButtonComponent;
