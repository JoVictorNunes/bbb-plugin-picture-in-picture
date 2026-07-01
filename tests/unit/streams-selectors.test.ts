import {
  describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import { createVideoSelector, extractVideoStreamIds } from '../../src/plugin-pip/components/streams/utils';

describe('createVideoSelector', () => {
  it('builds a scoped selector for the given stream id', () => {
    expect(createVideoSelector('abc')).toBe('.video-provider_list .videoContainer[data-stream="abc"] video');
  });
});

describe('extractVideoStreamIds', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('returns an empty array for a null container', () => {
    expect(extractVideoStreamIds(null)).toEqual([]);
  });

  it('returns an empty array when there are no video containers', () => {
    expect(extractVideoStreamIds(container)).toEqual([]);
  });

  it('collects the data-stream attribute of each video container in order', () => {
    container.innerHTML = `
      <div class="videoContainer" data-stream="s1"></div>
      <div class="videoContainer" data-stream="s2"></div>
    `;
    expect(extractVideoStreamIds(container)).toEqual(['s1', 's2']);
  });

  it('yields null for a video container without a data-stream attribute', () => {
    container.innerHTML = '<div class="videoContainer"></div>';
    expect(extractVideoStreamIds(container)).toEqual([null]);
  });
});
