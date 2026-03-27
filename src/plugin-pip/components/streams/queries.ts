export const VIDEO_STREAMS_SUBSCRIPTION = `
  subscription VideoStreams {
    user_camera {
      streamId
      user {
        name
        userId
      }
      voice {
        talking
      }
    }
  }
`;

export interface VideoStreamsSubscriptionResult {
  user_camera?: {
    streamId: string
    user: {
      name: string
      userId: string
    };
    voice?: {
      talking: boolean;
    };
  }[];
}

export const SCREENSHARE = `
  subscription Screenshare {
    screenshare {
      stream
    }
  }
`;

export interface ScreenshareSubscriptionResult {
  screenshare: {
    stream: string;
  }[];
}
