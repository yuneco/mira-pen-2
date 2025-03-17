import { nanoid } from 'nanoid';
import type { Rect } from '../types/coord';
import type { OvalShape, RectShape, ShapeStyle } from '../types/shape';

export const DEFAULT_RECT_STYLE: ShapeStyle = {
  strokeColor: '#9cbb8b',
  strokeWidth: 4,
  fillColor: '#dee9a8',
};

export const DEFAULT_OVAL_STYLE: ShapeStyle = {
  strokeColor: '#892e71',
  strokeWidth: 4,
  fillColor: '#efb7c9',
};

export const createRectShape = (rect: Rect): RectShape => {
  return {
    id: nanoid(),
    kind: 'rect',
    rect,
    style: DEFAULT_RECT_STYLE,
  };
};

export const createOvalShape = (rect: Rect): OvalShape => {
  return {
    id: nanoid(),
    kind: 'oval',
    rect,
    style: DEFAULT_OVAL_STYLE,
  };
};
