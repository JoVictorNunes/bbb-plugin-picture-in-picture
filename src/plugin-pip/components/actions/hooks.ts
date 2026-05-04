import { useCallback } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import {
  USER_SET_MUTED,
  CAMERA_BROADCAST_STOP,
  type UserSetMutedMutationVariables,
  type CameraBroadcastStopMutationVariables,
} from './mutations';
import {
  CURRENT_USER_QUERY,
  type CurrentUserSubscriptionResult,
} from './queries';
import {
  VIDEO_STREAMS_SUBSCRIPTION,
  type VideoStreamsSubscriptionResult,
} from '../../components/streams/queries';

export const useToggleVoice = (pluginApi: PluginApi) => {
  const [
    userSetMuted,
  ] = pluginApi.useCustomMutation!<UserSetMutedMutationVariables>(USER_SET_MUTED);

  const toggleVoice = async (userId: string, muted: boolean) => {
    try {
      if (userSetMuted) userSetMuted({ variables: { muted, userId } });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error on trying to toggle muted');
    }
  };

  return useCallback(toggleVoice, [userSetMuted]);
};

export const useCurrentUserVoice = (pluginApi: PluginApi) => {
  const {
    data: currentUserData,
  } = pluginApi.useCustomSubscription<CurrentUserSubscriptionResult>(CURRENT_USER_QUERY);

  return currentUserData?.user_current ? currentUserData.user_current[0].voice : undefined;
};

export const useExitVideo = (pluginApi: PluginApi) => {
  const currentUser = pluginApi.useCurrentUser!();
  const [
    cameraBroadcastStop,
  ] = pluginApi.useCustomMutation<CameraBroadcastStopMutationVariables>(CAMERA_BROADCAST_STOP);
  const {
    data: videoStreams,
  } = pluginApi.useCustomSubscription<VideoStreamsSubscriptionResult>(VIDEO_STREAMS_SUBSCRIPTION);

  const exitVideo = useCallback(async () => {
    const sendUserUnshareWebcam = (
      cameraId: string,
    ) => cameraBroadcastStop({ variables: { cameraId } });

    const ownVideoStreams = videoStreams.user_camera.filter(
      (stream) => stream.user.userId === currentUser?.data?.userId,
    );

    if (ownVideoStreams) {
      const results = ownVideoStreams.map((s) => sendUserUnshareWebcam(s.streamId));

      return Promise.all(results).then(() => true).catch((e) => {
        // eslint-disable-next-line no-console
        console.warn({
          logCode: 'exit_video_error',
          extraInfo: {
            errorMessage: e.message,
            errorStack: e.stack,
          },
        }, `Failed to exit video: ${e.message}`);
        return false;
      });
    }
    return true;
  }, [cameraBroadcastStop, videoStreams, currentUser]);

  return exitVideo;
};

export default { useToggleVoice };
