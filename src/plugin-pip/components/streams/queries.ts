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

// Upper bound for the number of tiles shown in the grid. Avatars only fill the
// slots left over by the webcams, so the PiP window never gets overcrowded.
export const MAX_TILES = 10;

export const USERS_SUBSCRIPTION = `
  subscription Users {
    user(
      where: {
        isSharingCamera: { _eq: false },
      },
      limit: ${MAX_TILES},
      order_by: [
        { nameSortable: asc },
        { userId: asc },
        { voice: { lastFloorTime: desc_nulls_last } },
      ],
    ) {
      userId
      name
      avatar
      color
      voice {
        talking
      }
    }
  }
`;

export interface UsersSubscriptionResult {
  user?: {
    userId: string;
    name: string | null;
    avatar: string | null;
    color: string | null;
    voice?: { talking: boolean };
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
