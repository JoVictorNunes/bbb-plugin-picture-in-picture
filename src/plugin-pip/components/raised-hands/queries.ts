export interface RaisedHandUserSubscriptionResponse {
  user: {
    userId: string;
    name: string;
    color: string;
    presenter: boolean;
    isModerator: boolean;
    raiseHand: boolean;
    raiseHandTime: string;
    whiteboardWriteAccess: boolean;
  }[];
}

export const RAISED_HAND_USERS = `
  subscription RaisedHandUsers($cursor: timestamptz!) {
    user(
      where: {
        raiseHand: {_eq: true},
        raiseHandTime: {_gt: $cursor}
      },
      order_by: [
        {raiseHandTime: asc_nulls_last},
      ]
    ) {
      userId
      name
      color
      presenter
      isModerator
      raiseHand
      raiseHandTime
      whiteboardWriteAccess
    }
  }
`;
