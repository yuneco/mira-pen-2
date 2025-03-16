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
