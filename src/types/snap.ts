import type { Point } from './coord';

/**
 * X軸に沿ったスナップ。
 * xの値をvalueに固定する
 */
type XSnap = {
  kind: 'x';
  value: number;
};

/**
 * Y軸に沿ったスナップ。
 * yの値をvalueに固定する
 */
type YSnap = {
  kind: 'y';
  value: number;
};

/**
 * 直線に沿ったスナップ。
 * 直線の両端の座標をp1, p2に固定する
 * （線分ではなく、無限に伸びる直線）
 */
type LineSnap = {
  kind: 'line';
  p1: Point;
  p2: Point;
};

/**
 * 点に沿ったスナップ。
 * 点の座標をpに固定する
 */
type PointSnap = {
  kind: 'point';
  p: Point;
};

export type Snap = XSnap | YSnap | LineSnap | PointSnap;
