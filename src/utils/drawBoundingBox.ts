import type { ViewCoord } from '../state/viewState';
import type { Point, Rect } from '../types/coord';
import type { Shape } from '../types/shape';

type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ResizeHandlePosition = { [key in ResizeHandle]: Point };

// 設定
const BOX_STROKE_WIDTH = 2;
const BOX_STROKE_COLOR = 'blue';
const HANDLE_SIZE = 10;
const HANDLE_STROKE_WIDTH = 2;
const HANDLE_STROKE_COLOR = 'blue';
const HANDLE_FILL_COLOR = 'white';

/** バウンディングボックスのパディング＝ボックスの線の内側と図形の矩形の距離 */
const BOX_PADDING = 4;

/**
 * リサイズハンドルの位置を計算
 * @param box - バウンディングボックスの矩形情報
 * @param handleOffset - ハンドルの中心位置のオフセット
 * @returns リサイズハンドルの位置
 */
const calculateHandlePositions = (box: Rect, handleOffset: number): ResizeHandlePosition => {
  const { x, y, width, height } = box;
  return {
    'top-left': { x: x - handleOffset, y: y - handleOffset },
    'top-right': { x: x + width - handleOffset, y: y - handleOffset },
    'bottom-left': { x: x - handleOffset, y: y + height - handleOffset },
    'bottom-right': { x: x + width - handleOffset, y: y + height - handleOffset },
  };
};

/**
 * バウンディングボックスを描画
 * @param ctx - キャンバスのコンテキスト
 * @param shape - 図形
 * @param view - 描画座標
 */
export const drawBoundingBox = (ctx: CanvasRenderingContext2D, shape: Shape, view: ViewCoord) => {
  const { x, y, width, height } = shape.rect;

  // スケールに応じた線幅とハンドルサイズの調整
  const scaledStrokeWidth = BOX_STROKE_WIDTH / view.scale;
  const scaledHandleSize = HANDLE_SIZE / view.scale;
  const scaledHandleStrokeWidth = HANDLE_STROKE_WIDTH / view.scale;
  const scaledPadding = BOX_PADDING / view.scale;

  // パディングを適用した矩形の情報
  const box: Rect = {
    x: x - scaledPadding,
    y: y - scaledPadding,
    width: width + scaledPadding * 2,
    height: height + scaledPadding * 2,
    angle: 0, // バウンディングボックスは回転しない
  };

  // 座標変換行列を適用
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // バウンディングボックスを描画
  ctx.strokeStyle = BOX_STROKE_COLOR;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.strokeRect(box.x, box.y, box.width, box.height);

  // ハンドル位置を計算
  const halfHandle = scaledHandleSize / 2;
  const handlePositions = calculateHandlePositions(box, halfHandle);

  // 四隅にハンドルを描画
  ctx.fillStyle = HANDLE_FILL_COLOR;
  ctx.strokeStyle = HANDLE_STROKE_COLOR;
  ctx.lineWidth = scaledHandleStrokeWidth;
  ctx.beginPath();

  for (const { x: handleX, y: handleY } of Object.values(handlePositions)) {
    ctx.rect(handleX, handleY, scaledHandleSize, scaledHandleSize);
  }

  ctx.fill();
  ctx.stroke();

  // 座標変換行列をリセット
  ctx.restore();
};

/**
 * Canvas上の座標に対応するリサイズハンドルを探す
 * @param shape - 図形
 * @param view - 描画座標
 * @param pointCanvas - Canvas座標
 * @returns ハンドル。見つからない場合はundefined。
 */
export const findHandle = (
  shape: Shape,
  view: ViewCoord,
  pointCanvas: Point
): ResizeHandle | undefined => {
  // TODO あとで実装
  return undefined;
};
