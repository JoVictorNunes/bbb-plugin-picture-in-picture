export interface RaisedHandUser {
  userId: string;
  name: string;
  color: string;
  presenter: boolean;
  isModerator: boolean;
  raiseHand: boolean;
  raiseHandTime: string;
}

export interface RaisedHandUsersSubscriptionResponse {
  user: RaisedHandUser[];
}

export const RAISED_HAND_USERS = `
  subscription RaisedHandUsers {
    user(
      where: {
        raiseHand: {_eq: true}
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
    }
  }
`;
