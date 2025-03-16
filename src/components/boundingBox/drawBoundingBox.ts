import { cornerPoints, expandRect, rectFromPointAndPadding } from '../../coordinates/coordUtils';
import type { ViewCoord } from '../../state/viewState';
import type { Point, Rect } from '../../types/coord';
import type { Shape } from '../../types/shape';

export type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type RotateHandle = 'rotate';

type BoundingBox = {
  body: Rect;
  handles: {
    [key in ResizeHandle]: {
      center: Point;
      rect: Rect;
    };
  };
};

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
 * 図形のバウンディングボックスを返す
 * @param shape - 図形
 * @param view - 描画座標系
 * @returns バウンディングボックス
 */
const boundingBoxForShape = (shape: Shape, view: ViewCoord): BoundingBox => {
  const scaledPadding = BOX_PADDING / view.scale;
  const scaledHandleSize = HANDLE_SIZE / view.scale;
  const body = expandRect(shape.rect, scaledPadding);
  const corners = cornerPoints(body);

  const corner2Handle = (corner: Point): BoundingBox['handles'][keyof BoundingBox['handles']] => {
    return {
      center: corner,
      rect: {
        ...rectFromPointAndPadding(corner, scaledHandleSize / 2),
        angle: body.angle,
      },
    };
  };
  const handles = {
    'top-left': corner2Handle(corners[0]),
    'top-right': corner2Handle(corners[1]),
    'bottom-left': corner2Handle(corners[2]),
    'bottom-right': corner2Handle(corners[3]),
  };
  return { body, handles };
};

/**
 * バウンディングボックスを描画
 * @param ctx - キャンバスのコンテキスト
 * @param shape - 図形
 * @param view - 描画座標
 */
export const drawBoundingBox = (ctx: CanvasRenderingContext2D, shape: Shape, view: ViewCoord) => {
  // スケールに応じた線幅とハンドルサイズの調整
  const scaledStrokeWidth = BOX_STROKE_WIDTH / view.scale;
  const scaledHandleStrokeWidth = HANDLE_STROKE_WIDTH / view.scale;

  // バウンディングボックスの情報を取得
  const boundingBox = boundingBoxForShape(shape, view);
  const box = boundingBox.body;

  // 座標変換行列を適用
  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // 図形の中心点を計算
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // バウンディングボックスを描画（図形の回転を考慮）
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((box.angle * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  ctx.strokeStyle = BOX_STROKE_COLOR;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.restore();

  // ハンドルを描画
  ctx.fillStyle = HANDLE_FILL_COLOR;
  ctx.strokeStyle = HANDLE_STROKE_COLOR;
  ctx.lineWidth = scaledHandleStrokeWidth;
  ctx.beginPath();

  // 各ハンドルを描画
  for (const handle of Object.values(boundingBox.handles)) {
    const { rect, center } = handle;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate((rect.angle * Math.PI) / 180);
    ctx.translate(-center.x, -center.y);
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill();
    ctx.restore();
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
 * @param canvasPoint - ビュー座標
 * @returns ハンドル。見つからない場合はundefined。
 */
export const findHandle = (
  shape: Shape,
  view: ViewCoord,
  canvasPoint: Point
): ResizeHandle | undefined => {
  // バウンディングボックスの情報を取得
  const boundingBox = boundingBoxForShape(shape, view);

  console.log('boundingBox', boundingBox, canvasPoint);

  // 各ハンドルをチェック
  for (const [handleName, handle] of Object.entries(boundingBox.handles) as [
    ResizeHandle,
    (typeof boundingBox.handles)[ResizeHandle],
  ][]) {
    const { center } = handle;
    const halfHandleSize = HANDLE_SIZE / (2 * view.scale);

    if (
      Math.abs(center.x - canvasPoint.x) <= halfHandleSize &&
      Math.abs(center.y - canvasPoint.y) <= halfHandleSize
    ) {
      return handleName as ResizeHandle;
    }
  }

  return undefined;
};
