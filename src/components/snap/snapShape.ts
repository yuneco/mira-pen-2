import { cornerPoints, distance } from '../../coordinates/coordUtils';
import type { Point } from '../../types/coord';
import type { Shape } from '../../types/shape';
import type { PointSnap, Snap, XSnap, YSnap } from '../../types/snap';

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

const distanceFromXSnap = (point: Point, snap: XSnap): SnapDistance => {
  // X軸スナップの場合、X座標の差の絶対値が距離
  const d = Math.abs(snap.value - point.x);
  return {
    snap,
    distance: d,
    // 最も近い点はX座標がスナップ値で、Y座標は元の点と同じ
    nearest: {
      x: snap.value,
      y: point.y,
    },
    // 差分はX方向のみ
    diff: {
      x: snap.value - point.x,
      y: 0,
    },
  };
};

const distanceFromYSnap = (point: Point, snap: YSnap): SnapDistance => {
  // Y軸スナップの場合、Y座標の差の絶対値が距離
  const d = Math.abs(snap.value - point.y);
  return {
    snap,
    distance: d,
    // 最も近い点はY座標がスナップ値で、X座標は元の点と同じ
    nearest: {
      x: point.x,
      y: snap.value,
    },
    // 差分はY方向のみ
    diff: {
      x: 0,
      y: snap.value - point.y,
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

  // スナップの種類ごとにフィルタリング
  const pointSnaps = snaps.filter((snap): snap is PointSnap => snap.kind === 'point');
  const xSnaps = snaps.filter((snap): snap is XSnap => snap.kind === 'x');
  const ySnaps = snaps.filter((snap): snap is YSnap => snap.kind === 'y');

  // 各アンカーポイントと各スナップの距離を計算
  const allSnapDistances: SnapDistance[] = [];

  for (const anchorPoint of anchorPoints) {
    // PointSnapとの距離を計算
    for (const pointSnap of pointSnaps) {
      allSnapDistances.push(distanceFromPointSnap(anchorPoint, pointSnap));
    }

    // XSnapとの距離を計算
    for (const xSnap of xSnaps) {
      allSnapDistances.push(distanceFromXSnap(anchorPoint, xSnap));
    }

    // YSnapとの距離を計算
    for (const ySnap of ySnaps) {
      allSnapDistances.push(distanceFromYSnap(anchorPoint, ySnap));
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
