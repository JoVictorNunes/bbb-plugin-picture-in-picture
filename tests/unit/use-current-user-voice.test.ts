import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentUserVoice } from '../../src/plugin-pip/components/actions/hooks';

const makeApi = (data: unknown) => ({
  useCustomSubscription: vi.fn(() => ({ data })),
} as never);

describe('useCurrentUserVoice', () => {
  it('returns undefined when there is no subscription data', () => {
    const { result } = renderHook(() => useCurrentUserVoice(makeApi(undefined)));
    expect(result.current).toBeUndefined();
  });

  it('returns undefined when user_current is absent', () => {
    const { result } = renderHook(() => useCurrentUserVoice(makeApi({})));
    expect(result.current).toBeUndefined();
  });

  it('returns the voice object of the current user', () => {
    const voice = {
      muted: false, talking: true, joined: true, listenOnly: false,
    };
    const { result } = renderHook(() => useCurrentUserVoice(makeApi({ user_current: [{ voice }] })));
    expect(result.current).toBe(voice);
  });
});
