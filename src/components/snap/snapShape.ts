import { cornerPoints, distance } from '../../coordinates/coordUtils';
import type { Point } from '../../types/coord';
import type { Shape } from '../../types/shape';
import type { LineSnap, PointSnap, Snap, XSnap, YSnap } from '../../types/snap';

const SNAP_DISTANCE_THRESHOLD = 16;

/**
 * スナップの種類の優先度。
 * 閾値内のスナップの中でどのスナップを最近傍とするかを決めるために使用する。
 * この値と距離の積が最小のスナップを選択する。
 * （すなわち、値が小さいものほど優先される）
 */
const SNAP_KIND_PRIORITY = {
  point: 1.0,
  x: 10,
  y: 10,
  line: 10,
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
 * リサイズハンドルのスナップ処理を行う。
 * ローカル座標系のコーナー点をキャンバス座標に変換し、スナップ処理を適用した後、ローカル座標系に戻す。
 *
 * @param movingCornerLocal リサイズ中のハンドルのローカル座標
 * @param centerX 図形の中心X座標
 * @param centerY 図形の中心Y座標
 * @param angle 図形の回転角度
 * @param snaps スナップのリスト
 * @returns スナップ適用後のローカル座標。スナップしなかった場合は元の座標を返す。
 */
export const snapResizeHandlePoint = (
  movingCornerLocal: Point,
  centerX: number,
  centerY: number,
  angle: number,
  snaps: Snap[]
): Point => {
  // 回転角度をラジアンに変換
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // ローカル座標をキャンバス座標に変換してスナップ対象として検証
  const movingCornerCanvas = {
    x: centerX + movingCornerLocal.x * cos - movingCornerLocal.y * sin,
    y: centerY + movingCornerLocal.x * sin + movingCornerLocal.y * cos,
  };

  // スナップ対象が見つかった場合は位置を修正
  const snappedCornerCanvas = snapCandidatePoint(movingCornerCanvas, snaps);

  // スナップがない場合は元の座標を返す
  if (!snappedCornerCanvas) {
    return movingCornerLocal;
  }

  // キャンバス座標からローカル座標に戻す
  // 移動前の中心点と角度を基準に変換
  const dx = snappedCornerCanvas.x - centerX;
  const dy = snappedCornerCanvas.y - centerY;

  // 回転を打ち消す逆変換を適用してローカル座標に戻す
  return {
    x: dx * cos + dy * sin,
    y: -dx * sin + dy * cos,
  };
};

/**
 * 単一の点に対してスナップを適用する
 * @param point スナップを適用する点
 * @param snaps スナップのリスト
 * @returns スナップを適用した点。スナップがない場合はundefinedを返す。
 */
export const snapCandidatePoint = (point: Point, snaps: Snap[]): Point | undefined => {
  // スナップの種類ごとにフィルタリング
  const pointSnaps = snaps.filter((snap): snap is PointSnap => snap.kind === 'point');
  const xSnaps = snaps.filter((snap): snap is XSnap => snap.kind === 'x');
  const ySnaps = snaps.filter((snap): snap is YSnap => snap.kind === 'y');
  const lineSnaps = snaps.filter((snap): snap is LineSnap => snap.kind === 'line');

  // 各スナップの距離を計算
  const allSnapDistances: SnapDistance[] = [];

  // PointSnapとの距離を計算
  for (const pointSnap of pointSnaps) {
    allSnapDistances.push(distanceFromPointSnap(point, pointSnap));
  }

  // XSnapとの距離を計算
  for (const xSnap of xSnaps) {
    allSnapDistances.push(distanceFromXSnap(point, xSnap));
  }

  // YSnapとの距離を計算
  for (const ySnap of ySnaps) {
    allSnapDistances.push(distanceFromYSnap(point, ySnap));
  }

  // LineSnapとの距離を計算
  for (const lineSnap of lineSnaps) {
    allSnapDistances.push(distanceFromLineSnap(point, lineSnap));
  }

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

  // 最近接点にスナップ
  return minSnapDistance.nearest;
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

  console.log({ minSnapDistance, filteredSnapDistances });
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
