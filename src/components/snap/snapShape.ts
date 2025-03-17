import { cornerPoints, distance } from '../../coordinates/coordUtils';
import type { Point } from '../../types/coord';
import type { Shape } from '../../types/shape';
import type { PointSnap, Snap } from '../../types/snap';

const SNAP_DISTANCE_THRESHOLD = 10;

const snapPointsOfShape = (shape: Shape) => {
  return cornerPoints(shape.rect);
};

/**
 * スナップ対象の点とスナップの距離
 */
type SnapDistance = {
  snap: Snap;
  /** スナップ対象の点とスナップの距離。この距離が最小のスナップを選択する */
  distance: number;
  /** スナップ対象の点とスナップの距離が最小の点 */
  nearest: Point;
  /** スナップ対象の点とスナップの距離が最小の点とスナップの点の差 */
  diff: Point;
};

const distanceFromPointSnap = (point: Point, snap: PointSnap): SnapDistance => {
  const d = distance(point, snap.p);
  return {
    snap,
    distance: d,
    nearest: snap.p,
    diff: {
      x: snap.p.x - point.x,
      y: snap.p.y - point.y,
    },
  };
};

/**
 * 形状にスナップを適用する
 * @param shape スナップを適用する図形
 * @param snaps スナップのリスト
 * @returns スナップを適用した形状。スナップがない場合はundefinedを返す。
 */
export const snapShape = (shape: Shape, snaps: Snap[]): Shape | undefined => {
  const anchorPoints = snapPointsOfShape(shape);

  // PointSnapのみをフィルタリング
  const pointSnaps = snaps.filter((snap): snap is PointSnap => snap.kind === 'point');

  // 各アンカーポイントと各PointSnapの距離を計算
  const allSnapDistances: SnapDistance[] = [];

  for (const anchorPoint of anchorPoints) {
    for (const pointSnap of pointSnaps) {
      allSnapDistances.push(distanceFromPointSnap(anchorPoint, pointSnap));
    }
  }

  console.log({ allSnapDistances, anchorPoints });

  // 閾値以下の距離を持つスナップだけをフィルタリング
  const filteredSnapDistances = allSnapDistances.filter(
    (snapDistance) => snapDistance.distance <= SNAP_DISTANCE_THRESHOLD
  );

  // フィルタリングされたスナップがない場合はundefinedを返す
  if (filteredSnapDistances.length === 0) {
    return undefined;
  }

  // フィルタリングされたスナップの中から最小の距離を持つスナップを選択
  let minSnapDistance = filteredSnapDistances[0];
  for (let i = 1; i < filteredSnapDistances.length; i++) {
    if (filteredSnapDistances[i].distance < minSnapDistance.distance) {
      minSnapDistance = filteredSnapDistances[i];
    }
  }

  console.log(minSnapDistance);
  // 選択したスナップのdiffを形状の座標に加算
  const snappedShape = {
    ...shape,
    rect: {
      ...shape.rect,
      x: shape.rect.x + minSnapDistance.diff.x,
      y: shape.rect.y + minSnapDistance.diff.y,
    },
  };
  return snappedShape;
};
