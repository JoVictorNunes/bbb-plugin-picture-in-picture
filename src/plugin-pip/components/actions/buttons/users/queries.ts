export const USER_AGGREGATE_COUNT_SUBSCRIPTION = `
  subscription UsersCount {
    user_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export interface UsersCountSubscriptionResponse {
  user_aggregate: {
    aggregate: {
      count: number;
    };
  };
}
