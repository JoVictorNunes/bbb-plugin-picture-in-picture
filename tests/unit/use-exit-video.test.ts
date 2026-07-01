import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExitVideo } from '../../src/plugin-pip/components/actions/hooks';

const makeApi = (opts: {
  userId?: string;
  cameraBroadcastStop: unknown;
  userCamera: unknown[];
}) => ({
  useCurrentUser: vi.fn(() => ({ data: { userId: opts.userId } })),
  useCustomMutation: vi.fn(() => [opts.cameraBroadcastStop]),
  useCustomSubscription: vi.fn(() => ({ data: { user_camera: opts.userCamera } })),
} as never);

describe('useExitVideo', () => {
  it('stops only the current user own camera streams and resolves true', async () => {
    const cameraBroadcastStop = vi.fn().mockResolvedValue(undefined);
    const api = makeApi({
      userId: 'u1',
      cameraBroadcastStop,
      userCamera: [
        { streamId: 's1', user: { userId: 'u1' } },
        { streamId: 's2', user: { userId: 'u2' } },
        { streamId: 's3', user: { userId: 'u1' } },
      ],
    });

    const { result } = renderHook(() => useExitVideo(api));
    await expect(result.current()).resolves.toBe(true);

    expect(cameraBroadcastStop).toHaveBeenCalledTimes(2);
    expect(cameraBroadcastStop).toHaveBeenCalledWith({ variables: { cameraId: 's1' } });
    expect(cameraBroadcastStop).toHaveBeenCalledWith({ variables: { cameraId: 's3' } });
  });

  it('resolves true without stopping anything when the user has no streams', async () => {
    const cameraBroadcastStop = vi.fn().mockResolvedValue(undefined);
    const api = makeApi({
      userId: 'u1',
      cameraBroadcastStop,
      userCamera: [{ streamId: 's2', user: { userId: 'u2' } }],
    });

    const { result } = renderHook(() => useExitVideo(api));
    await expect(result.current()).resolves.toBe(true);
    expect(cameraBroadcastStop).not.toHaveBeenCalled();
  });

  it('resolves false when stopping a stream rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const cameraBroadcastStop = vi.fn().mockRejectedValue(new Error('boom'));
    const api = makeApi({
      userId: 'u1',
      cameraBroadcastStop,
      userCamera: [{ streamId: 's1', user: { userId: 'u1' } }],
    });

    const { result } = renderHook(() => useExitVideo(api));
    await expect(result.current()).resolves.toBe(false);
    warnSpy.mockRestore();
  });
});
