import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToggleVoice } from '../../src/plugin-pip/components/actions/hooks';

const makeApi = (userSetMuted: unknown) => ({
  useCustomMutation: vi.fn(() => [userSetMuted]),
} as never);

describe('useToggleVoice', () => {
  it('calls the mutation with the user id and muted flag', async () => {
    const userSetMuted = vi.fn();
    const { result } = renderHook(() => useToggleVoice(makeApi(userSetMuted)));

    await result.current('user-1', true);

    expect(userSetMuted).toHaveBeenCalledWith({ variables: { muted: true, userId: 'user-1' } });
  });

  it('does nothing when the mutation is not available', async () => {
    const { result } = renderHook(() => useToggleVoice(makeApi(undefined)));
    await expect(result.current('user-1', false)).resolves.toBeUndefined();
  });

  it('swallows errors thrown by the mutation', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const userSetMuted = vi.fn(() => { throw new Error('boom'); });
    const { result } = renderHook(() => useToggleVoice(makeApi(userSetMuted)));

    await expect(result.current('user-1', true)).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
