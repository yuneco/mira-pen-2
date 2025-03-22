import type { Point, Rect } from '../types/coord';

// point

export const addPoint = (point1: Point, point2: Point): Point => {
  return { x: point1.x + point2.x, y: point1.y + point2.y };
};

export const subPoint = (point1: Point, point2: Point): Point => {
  return { x: point1.x - point2.x, y: point1.y - point2.y };
};

export const mulPoint = (point: Point, scalar: number): Point => {
  return { x: point.x * scalar, y: point.y * scalar };
};

export const distance = (point1: Point, point2: Point): number => {
  return Math.sqrt((point1.x - point2.x) ** 2 + (point1.y - point2.y) ** 2);
};

// rect
export const rectFromPointAndPadding = (point: Point, padding: number): Rect => {
  return {
    x: point.x - padding,
    y: point.y - padding,
    width: padding * 2,
    height: padding * 2,
    angle: 0,
  };
};

export const expandRect = (rect: Rect, padding: number): Rect => {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    angle: rect.angle,
  };
};

/**
 * 矩形の4つの角の座標を返します。
 * @param rect - 矩形
 * @returns 4つの角の座標。左上から時計回りの要素数4の配列です
 */
export const cornerPoints = (rect: Rect): Point[] => {
  // 図形の中心点を計算
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  // 回転角をラジアンに変換
  const rad = (rect.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 回転前の各頂点の中心からの相対座標
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  const relativePoints = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  // 各頂点を回転させて絶対座標に変換
  return relativePoints.map((point) => ({
    x: centerX + (point.x * cos - point.y * sin),
    y: centerY + (point.x * sin + point.y * cos),
  }));
};

/**
 * 図形のローカル座標からキャンバス座標に変換する
 * @param shape 図形
 * @param localPoint 図形のローカル座標
 * @returns キャンバス座標
 */
export const localPointToCanvasPoint = (shape: Rect, localPoint: Point): Point => {
  const { x, y, width, height, angle } = shape;

  // 図形の中心点を計算
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // 回転角度をラジアンに変換
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // ローカル座標をキャンバス座標に変換
  const canvasX = centerX + localPoint.x * cos - localPoint.y * sin;
  const canvasY = centerY + localPoint.x * sin + localPoint.y * cos;

  return { x: canvasX, y: canvasY };
};
