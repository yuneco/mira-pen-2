import { nanoid } from 'nanoid';
import type { Rect } from '../types/coord';
import type { OvalShape, RectShape, ShapeStyle } from '../types/shape';

const DEFAULT_STYLE: ShapeStyle = {
  strokeColor: '#000',
  strokeWidth: 1,
  fillColor: '#fff',
};

export const createRectShape = (rect: Rect): RectShape => {
  return {
    id: nanoid(),
    kind: 'rect',
    rect,
    style: DEFAULT_STYLE,
  };
};

export const createOvalShape = (rect: Rect): OvalShape => {
  return {
    id: nanoid(),
    kind: 'oval',
    rect,
    style: DEFAULT_STYLE,
  };
};
