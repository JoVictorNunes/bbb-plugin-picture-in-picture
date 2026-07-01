import {
  describe, it, expect, vi,
} from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  PresentationWhiteboardUiDataNames: { CURRENT_PAGE_SNAPSHOT: 'CURRENT_PAGE_SNAPSHOT' },
}));

// eslint-disable-next-line import/first
import { usePresentationSnapshot } from '../../src/plugin-pip/components/streams/hooks';

// The hook effect depends on the pluginApi identity, so tests must keep a stable
// reference across re-renders (a fresh object per render would re-run the effect).
const makeApi = (getUiData?: unknown) => ({ getUiData } as never);

describe('usePresentationSnapshot', () => {
  it('stays idle and does not fetch when disabled', () => {
    const getUiData = vi.fn();
    const api = makeApi(getUiData);
    const { result } = renderHook(() => usePresentationSnapshot(api, false));

    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(getUiData).not.toHaveBeenCalled();
  });

  it('loads the current slide snapshot when enabled', async () => {
    const getUiData = vi.fn().mockResolvedValue({ base64Png: 'data:image/png;base64,AAAA' });
    const api = makeApi(getUiData);
    const { result } = renderHook(() => usePresentationSnapshot(api, true));

    await waitFor(() => expect(result.current.image).toBe('data:image/png;base64,AAAA'));
    expect(result.current.isLoading).toBe(false);
    expect(getUiData).toHaveBeenCalledWith('CURRENT_PAGE_SNAPSHOT');
  });

  it('clears loading and keeps a null image when the snapshot fetch rejects', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getUiData = vi.fn().mockRejectedValue(new Error('no snapshot'));
    const api = makeApi(getUiData);
    const { result } = renderHook(() => usePresentationSnapshot(api, true));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.image).toBeNull();
    warnSpy.mockRestore();
  });

  it('stops loading when the plugin api exposes no getUiData', () => {
    const api = makeApi(undefined);
    const { result } = renderHook(() => usePresentationSnapshot(api, true));
    expect(result.current.isLoading).toBe(false);
  });

  it('refetches the snapshot on the 5s interval', async () => {
    vi.useFakeTimers();
    try {
      const getUiData = vi.fn().mockResolvedValue({ base64Png: 'x' });
      const api = makeApi(getUiData);
      renderHook(() => usePresentationSnapshot(api, true));

      await vi.advanceTimersByTimeAsync(0);
      expect(getUiData).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(getUiData).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resets the image when it becomes disabled', async () => {
    const getUiData = vi.fn().mockResolvedValue({ base64Png: 'x' });
    const api = makeApi(getUiData);
    const { result, rerender } = renderHook(
      ({ enabled }) => usePresentationSnapshot(api, enabled),
      { initialProps: { enabled: true } },
    );

    await waitFor(() => expect(result.current.image).toBe('x'));

    rerender({ enabled: false });
    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
