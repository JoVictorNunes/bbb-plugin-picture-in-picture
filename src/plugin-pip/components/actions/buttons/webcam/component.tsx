import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useExitVideo } from '../../hooks';
import { VIDEO_STREAMS_SUBSCRIPTION, type VideoStreamsSubscriptionResult } from '../../../cameras/queries';
import Tooltip from '../../../ui/tooltip';

interface WebcamButtonComponentProps {
  pluginApi: PluginApi;
}

function WebcamButtonComponent({ pluginApi }: WebcamButtonComponentProps) {
  const exitVideo = useExitVideo(pluginApi);
  const currentUser = pluginApi.useCurrentUser();
  const {
    data: videoStreams,
  } = pluginApi.useCustomSubscription<VideoStreamsSubscriptionResult>(VIDEO_STREAMS_SUBSCRIPTION);

  const myStreams = videoStreams && videoStreams.user_camera.filter(
    (stream) => stream.user.userId === currentUser.data.userId,
  );

  const amISharing = myStreams?.length > 0;

  return (
    <Tooltip content={amISharing ? 'Stop sharing webcams' : 'You\'re not sharing webcam'}>
      {({ children, styles, ...props }) => (
        <button
          {...props}
          className="media-btn"
          type="button"
          style={styles}
          onClick={() => {
            if (amISharing) exitVideo();
          }}
          disabled={!amISharing}
        >
          <span className="sr-only">
            Stop webcams
          </span>
          <i className={`icon-bbb-${amISharing ? 'video' : 'video_off'}`} />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default WebcamButtonComponent;
