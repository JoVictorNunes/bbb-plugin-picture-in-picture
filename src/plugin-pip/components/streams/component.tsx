import * as React from 'react';
import { useEffect } from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { useVideoStreams, useScreenshare, usePresentationSnapshot } from './hooks';
import WebcamItem from './webcam-item';
import Video from './video';
import Skeleton from '../ui/skeleton';
import {
  createVideoSelector,
  findOptimalGrid,
  extractVideoStreamIds,
} from './utils';
import { useLayoutContext } from '../contexts/layout';
import { usePipWindow } from '../contexts/pip-window';
import { useRerenderRef } from '../../../common/hooks';

const pollForVideoSrc = (
  streamId: string,
  container: Element = document.body,
): Promise<MediaStream | null> => new Promise((resolve) => {
  const TIMEOUT = 5000; // 5 seconds
  const start = performance.now();
  const selector = createVideoSelector(streamId);

  const poll = () => {
    const timestamp: number = performance.now();
    const element = container.querySelector(selector);
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve(element.srcObject as MediaStream);
    }
    if (timestamp - start > TIMEOUT) {
      return resolve(null);
    }
    return setTimeout(poll);
  };

  setTimeout(poll);
});

const pollForScreenshareSrc = (): Promise<MediaProvider | null> => new Promise((resolve) => {
  const TIMEOUT = 5000;
  const start = performance.now();

  const poll = () => {
    const timestamp: number = performance.now();
    const element = document.querySelector('#screenshareContainer video');
    if (element && element instanceof HTMLVideoElement && element.srcObject) {
      return resolve(element.srcObject);
    }
    if (timestamp - start > TIMEOUT) {
      return resolve(null);
    }
    return setTimeout(poll);
  };

  setTimeout(poll);
});

const VIDEO_LIST_CLASSNAME = 'video-provider_list';

/**
 * A stream is worth reusing only while it can still deliver frames. A stream
 * whose track ended is the frozen-tile case: it keeps rendering its last frame
 * and reports a perfectly healthy element, so it has to be dropped explicitly.
 */
const isStreamLive = (stream: MediaStream): boolean => stream.active
  && stream.getVideoTracks().some((track) => track.readyState === 'live');

interface WebcamMedia {
  type: 'webcam';
  srcObject: MediaStream;
  streamId: string;
  userName: string;
  userId: string;
  userTalking: boolean;
}

interface ScreenshareMedia {
  type: 'screenshare';
  srcObject: MediaProvider;
  streamId: string;
}

interface SlideMedia {
  type: 'slide';
  streamId: string;
  image: string;
}

interface SlideLoadingMedia {
  type: 'slide-loading';
  streamId: string;
}

type GridMedia = WebcamMedia | ScreenshareMedia | SlideMedia | SlideLoadingMedia;

const SLIDE_STREAM_ID = 'presentation-slide';
const SLIDE_LOADING_STREAM_ID = 'presentation-slide-loading';

interface StreamsComponentProps {
  pluginApi: PluginApi;
  hasPresentation?: boolean;
}

function StreamsComponent({
  pluginApi,
  hasPresentation,
}: StreamsComponentProps): React.ReactNode {
  const [streams, setStreams] = React.useState<GridMedia[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState(Date.now());
  const { content: contentRect, contentFocused } = useLayoutContext();
  const pipWindow = usePipWindow();
  const camerasRef = useRerenderRef<HTMLDivElement>(null);
  const webcamsRef = useRerenderRef<HTMLDivElement>(null);
  // Streams already resolved from the client DOM, kept across refreshes so a
  // camera the client never renders cannot make every refresh pay the full
  // pollForVideoSrc timeout.
  const resolvedStreamsRef = React.useRef<Map<string, MediaStream>>(new Map());

  const {
    data: videoStreamsData,
  } = useVideoStreams(pluginApi);

  const {
    data: screenshareData,
  } = useScreenshare(pluginApi);

  const isSharing = Boolean(screenshareData?.screenshare[0]?.stream);
  const slideEnabled = Boolean(hasPresentation) && !isSharing;
  const { image: slideImage, isLoading: slideLoading } = usePresentationSnapshot(
    pluginApi,
    slideEnabled,
  );

  useEffect(() => {
    async function update() {
      const videoList = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
      const videoStreamIds = extractVideoStreamIds(videoList);
      const videoIndexes = Object.fromEntries(Object.entries(videoStreamIds)
        .map(([index, streamId]) => ([streamId, Number.parseInt(index, 10)])));
      const cameraStreams = videoStreamsData?.user_camera || [];

      // Cameras that went away must not keep an entry - and must not keep a
      // dead MediaStream alive either.
      const currentStreamIds = new Set(cameraStreams.map((stream) => stream.streamId));
      resolvedStreamsRef.current.forEach((_stream, streamId) => {
        if (!currentStreamIds.has(streamId)) resolvedStreamsRef.current.delete(streamId);
      });

      const videoSrc = cameraStreams.map(
        async (stream) => {
          const cached = resolvedStreamsRef.current.get(stream.streamId);
          // Only poll for streams we do not already hold a live handle to.
          const srcObject = cached && isStreamLive(cached)
            ? cached
            : await pollForVideoSrc(stream.streamId, videoList);

          if (srcObject) {
            resolvedStreamsRef.current.set(stream.streamId, srcObject);
            return {
              type: 'webcam' as const,
              streamId: stream.streamId,
              userName: stream.user?.name,
              userId: stream.user?.userId,
              userTalking: stream.voice?.talking,
              srcObject,
            };
          }

          resolvedStreamsRef.current.delete(stream.streamId);
          return null;
        },
      );

      const videoResolved = await Promise.all(videoSrc);
      const webcams: GridMedia[] = videoResolved.filter((v) => v).sort((a, b) => {
        const indexA = videoIndexes[a.streamId] ?? 0;
        const indexB = videoIndexes[b.streamId] ?? 0;
        return indexA - indexB;
      });

      if (isSharing) {
        const srcObject = await pollForScreenshareSrc();
        if (srcObject) {
          const screenshareItem: ScreenshareMedia = {
            type: 'screenshare',
            streamId: screenshareData.screenshare[0].stream,
            srcObject,
          };
          return [screenshareItem, ...webcams];
        }
      }

      if (slideImage) {
        const slideItem: SlideMedia = {
          type: 'slide',
          streamId: SLIDE_STREAM_ID,
          image: slideImage,
        };
        return [slideItem, ...webcams];
      }

      if (slideEnabled && slideLoading) {
        const slideLoadingItem: SlideLoadingMedia = {
          type: 'slide-loading',
          streamId: SLIDE_LOADING_STREAM_ID,
        };
        return [slideLoadingItem, ...webcams];
      }

      return webcams;
    }

    // update() can take seconds (pollForVideoSrc waits for the client to render
    // a <video>), so a newer run can start while this one is still pending.
    // Without this guard the slower, older run would publish last and overwrite
    // fresh streams with stale ones.
    let cancelled = false;

    setLoading(true);
    update()
      .then((nextStreams) => {
        if (!cancelled) setStreams(nextStreams);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoStreamsData, screenshareData, slideImage, slideLoading, slideEnabled, lastUpdate]);

  useEffect(() => {
    const targetNode = document.getElementsByClassName(VIDEO_LIST_CLASSNAME)[0];
    const config = { attributes: true, childList: true, subtree: true };

    const callback = () => {
      setLastUpdate(Date.now());
    };

    const observer = new MutationObserver(callback);

    if (targetNode) observer.observe(targetNode, config);

    return () => {
      observer.disconnect();
    };
  }, [videoStreamsData]);

  const paddingInline = camerasRef.current ? parseInt(pipWindow.getComputedStyle(camerasRef.current)
    .getPropertyValue('padding-inline'), 10) : 8;
  const paddingBlock = camerasRef.current ? parseInt(pipWindow.getComputedStyle(camerasRef.current)
    .getPropertyValue('padding-block'), 10) : 8;

  const gridGutter = webcamsRef.current ? parseInt(window.getComputedStyle(webcamsRef.current)
    .getPropertyValue('grid-row-gap'), 10) : 6;

  const optimalGrid = React.useMemo(() => findOptimalGrid(
    {
      width: contentRect.width - (paddingInline * 2),
      height: contentRect.height - (paddingBlock * 2),
    },
    streams.length || 4,
    gridGutter,
    contentFocused,
  ), [contentRect, streams.length, paddingInline, paddingBlock, contentFocused]);

  if (!streams.length && !loading) {
    return null;
  }

  const style: React.CSSProperties = {
    width: `${optimalGrid.width}px`,
    height: `${optimalGrid.height}px`,
    gridTemplateColumns: `repeat(${optimalGrid.columns}, 1fr)`,
    gridTemplateRows: `repeat(${optimalGrid.rows}, 1fr)`,
  };

  return (
    <div
      className="cameras"
      ref={camerasRef}
      style={{
        position: 'absolute',
        left: contentRect.x,
        top: contentRect.y,
        width: contentRect.width,
        height: contentRect.height,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div id="plugin-pip-webcams" className="webcams" style={style} ref={webcamsRef}>
        {loading && !streams.length ? Array.from({ length: 4 }).map((_e, i) => i).map((i) => <Skeleton height="unset" key={i} />) : streams.map((item) => {
          if (item.type === 'screenshare') {
            const className = ['pip-video-container', 'pip-screenshare-item'];
            if (contentFocused) className.push('pip-content-focused');
            return (
              <div key={item.streamId} className={className.join(' ')}>
                <Video srcObject={item.srcObject} talking={false} />
              </div>
            );
          }
          if (item.type === 'slide') {
            const className = ['pip-video-container', 'pip-slide-item'];
            if (contentFocused) className.push('pip-content-focused');
            return (
              <div key={item.streamId} className={className.join(' ')}>
                <img src={item.image} alt="current slide" />
              </div>
            );
          }
          if (item.type === 'slide-loading') {
            const className = ['pip-video-container', 'pip-slide-item'];
            if (contentFocused) className.push('pip-content-focused');
            return (
              <div key={item.streamId} className={className.join(' ')}>
                <Skeleton width="100%" height="100%" borderRadius={0} />
              </div>
            );
          }
          return (
            <WebcamItem
              key={item.streamId}
              streamId={item.streamId}
              srcObject={item.srcObject}
              userTalking={item.userTalking}
              userName={item.userName}
            />
          );
        })}
      </div>
    </div>
  );
}

export default StreamsComponent;
