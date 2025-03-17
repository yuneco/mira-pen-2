import { cornerPoints, distance } from '../../coordinates/coordUtils';
import type { Point } from '../../types/coord';
import type { Shape } from '../../types/shape';
import type { LineSnap, PointSnap, Snap, XSnap, YSnap } from '../../types/snap';

const SNAP_DISTANCE_THRESHOLD = 10;

/**
 * スナップの種類の優先度。
 * 閾値内のスナップの中でどのスナップを最近傍とするかを決めるために使用する。
 * この値と距離の積が最小のスナップを選択する。
 * （すなわち、値が小さいものほど優先される）
 */
const SNAP_KIND_PRIORITY = {
  point: 1.0,
  x: 1.5,
  y: 1.5,
  line: 2.0,
} as const satisfies Record<Snap['kind'], number>;

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

const distanceFromLineSnap = (point: Point, snap: LineSnap): SnapDistance => {
  // 直線の方向ベクトル
  const dx = snap.p2.x - snap.p1.x;
  const dy = snap.p2.y - snap.p1.y;

  // 直線の長さの二乗
  const lineLengthSq = dx * dx + dy * dy;

  // 点から直線に下ろした垂線の足を求める
  // 点と直線の距離を効率的に計算するために、ベクトルの内積を使用

  // 点から直線の始点へのベクトル
  const vx = point.x - snap.p1.x;
  const vy = point.y - snap.p1.y;

  // 内積を計算して、直線上の最近接点のパラメータtを求める
  // t = 0 なら始点、t = 1 なら終点、0 < t < 1 なら線分上
  // 直線の場合は t の範囲に制限はない
  const t = (vx * dx + vy * dy) / lineLengthSq;

  // 直線上の最近接点の座標
  const nearestX = snap.p1.x + t * dx;
  const nearestY = snap.p1.y + t * dy;

  // 点と直線の距離を計算
  // 点から最近接点へのベクトルの長さ
  const distX = point.x - nearestX;
  const distY = point.y - nearestY;
  const d = Math.sqrt(distX * distX + distY * distY);

  return {
    snap,
    distance: d,
    nearest: {
      x: nearestX,
      y: nearestY,
    },
    diff: {
      x: nearestX - point.x,
      y: nearestY - point.y,
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
  const lineSnaps = snaps.filter((snap): snap is LineSnap => snap.kind === 'line');

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

    // LineSnapとの距離を計算
    for (const lineSnap of lineSnaps) {
      allSnapDistances.push(distanceFromLineSnap(anchorPoint, lineSnap));
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

  // フィルタリングされたスナップの中から、優先度を考慮して最適なスナップを選択
  // 距離 × 優先度係数 が最小のスナップを選択する
  let minWeightedDistance =
    filteredSnapDistances[0].distance * SNAP_KIND_PRIORITY[filteredSnapDistances[0].snap.kind];
  let minSnapDistance = filteredSnapDistances[0];

  for (let i = 1; i < filteredSnapDistances.length; i++) {
    const currentSnapDistance = filteredSnapDistances[i];
    const currentWeightedDistance =
      currentSnapDistance.distance * SNAP_KIND_PRIORITY[currentSnapDistance.snap.kind];

    if (currentWeightedDistance < minWeightedDistance) {
      minWeightedDistance = currentWeightedDistance;
      minSnapDistance = currentSnapDistance;
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
