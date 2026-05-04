import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape, defineMessages } from 'react-intl';
import { useExitVideo } from '../../hooks';
import { VIDEO_STREAMS_SUBSCRIPTION, type VideoStreamsSubscriptionResult } from '../../../streams/queries';
import Tooltip from '../../../ui/tooltip';

export const intlMessages = defineMessages({
  webcamTooltipSharing: {
    id: 'plugin.webcam.tooltip.sharing',
    defaultMessage: 'Stop sharing webcams',
  },
  webcamTooltipNotSharing: {
    id: 'plugin.webcam.tooltip.notSharing',
    defaultMessage: "You're not sharing webcam",
  },
  webcamSrOnly: {
    id: 'plugin.webcam.srOnly',
    defaultMessage: 'Stop webcams',
  },
});

interface WebcamButtonComponentProps {
  intl: IntlShape;
  pluginApi: PluginApi;
}

function WebcamButtonComponent({ intl, pluginApi }: WebcamButtonComponentProps) {
  const exitVideo = useExitVideo(pluginApi);
  const currentUser = pluginApi.useCurrentUser();
  const {
    data: videoStreams,
  } = pluginApi.useCustomSubscription<VideoStreamsSubscriptionResult>(VIDEO_STREAMS_SUBSCRIPTION);

  const myStreams = videoStreams && videoStreams.user_camera.filter(
    (stream) => stream.user.userId === currentUser.data.userId,
  );

  const amISharing = myStreams?.length > 0;
  const stopSharingLabel = intl.formatMessage(intlMessages.webcamTooltipSharing);
  const notSharingLabel = intl.formatMessage(intlMessages.webcamTooltipNotSharing);

  return (
    <Tooltip content={amISharing ? stopSharingLabel : notSharingLabel}>
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
            {intl.formatMessage(intlMessages.webcamSrOnly)}
          </span>
          <i className={`icon-bbb-${amISharing ? 'video' : 'video_off'}`} />
          {children}
        </button>
      )}
    </Tooltip>
  );
}

export default WebcamButtonComponent;
