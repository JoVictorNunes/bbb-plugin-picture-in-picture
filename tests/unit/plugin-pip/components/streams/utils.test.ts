import {
  describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import {
  ASPECT_RATIO,
  calculateOptimalGrid,
  extractVideoStreamIds,
  findOptimalGrid,
  range,
} from '../../../../../src/plugin-pip/components/streams/utils';
import { createVideoSelector } from '../../../../../src/common/bbb-selectors';

describe('range', () => {
  it('returns the half-open interval [start, end)', () => {
    expect(range(0, 3)).toEqual([0, 1, 2]);
    expect(range(2, 5)).toEqual([2, 3, 4]);
  });

  it('returns an empty array when start >= end', () => {
    expect(range(3, 3)).toEqual([]);
    expect(range(5, 2)).toEqual([]);
  });

  it('supports negative starts', () => {
    expect(range(-2, 1)).toEqual([-2, -1, 0]);
  });
});

describe('calculateOptimalGrid', () => {
  it('fills a single cell to the full canvas at the 4:3 aspect ratio', () => {
    const grid = calculateOptimalGrid(400, 300, 0, ASPECT_RATIO, 1, 1);
    expect(grid).toEqual({
      columns: 1,
      rows: 1,
      width: 400,
      height: 300,
      filledArea: 120000,
    });
  });

  it('splits two items across two columns in a single row', () => {
    const grid = calculateOptimalGrid(400, 300, 0, ASPECT_RATIO, 2, 2);
    expect(grid).toEqual({
      columns: 2,
      rows: 1,
      width: 400,
      height: 150,
      filledArea: 60000,
    });
  });

  it('accounts for the gutter between columns and rows', () => {
    const grid = calculateOptimalGrid(400, 300, 10, ASPECT_RATIO, 4, 2);
    // 4 items in 2 columns -> 2 rows; the row height constraint shrinks the
    // cell so the grid fits: cellHeight=145, cellWidth=194.
    expect(grid).toEqual({
      columns: 2,
      rows: 2,
      width: 398,
      height: 300,
      filledArea: 194 * 145 * 4,
    });
  });
});

describe('findOptimalGrid', () => {
  it('returns a zeroed grid when there are no items', () => {
    expect(findOptimalGrid({ width: 400, height: 300 }, 0, 0)).toEqual({
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    });
    expect(findOptimalGrid({ width: 400, height: 300 }, -1, 0)).toEqual({
      rows: 0,
      filledArea: 0,
      columns: 0,
      height: 0,
      width: 0,
    });
  });

  it('picks a single column for a single item in a non-focused grid', () => {
    const grid = findOptimalGrid({ width: 400, height: 300 }, 1, 0, false);
    expect(grid).toEqual({
      columns: 1,
      rows: 1,
      width: 400,
      height: 300,
      filledArea: 120000,
    });
  });

  it('treats a null gridRect as a zero-sized canvas', () => {
    const grid = findOptimalGrid(null, 2, 0, false);
    expect(grid.width).toBe(0);
    expect(grid.height).toBe(0);
    expect(grid.filledArea).toBe(0);
  });

  it('uses at least two columns and pads item count when content-focused', () => {
    const grid = findOptimalGrid({ width: 800, height: 600 }, 1, 0, true);
    expect(grid.columns).toBeGreaterThanOrEqual(2);
    expect(grid.filledArea).toBeGreaterThan(0);
  });
});

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
