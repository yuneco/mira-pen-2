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
  rotateCircle: {
    center: Point;
    radius: number;
  };
  rotateHandle: {
    center: Point;
    rect: Rect;
  };
};

// 設定
const BOX_STROKE_WIDTH = 2;
const BOX_STROKE_COLOR = 'blue';
const HANDLE_SIZE = 10;
const HANDLE_STROKE_WIDTH = 2;
const HANDLE_STROKE_COLOR = 'blue';
const HANDLE_FILL_COLOR = 'white';
const ROTATE_HANDLE_SIZE = 8; // 回転ハンドルのサイズ
const ROTATE_CIRCLE_TOLERANCE = 5; // 回転円周の当たり判定の許容範囲
const ROTATE_HANDLE_FILL_COLOR = BOX_STROKE_COLOR; // 回転ハンドルの塗りつぶし色
const ROTATE_CIRCLE_COLOR = 'powderblue'; // 回転円の色
const ANGLE_FONT_SIZE = 10; // 角度表示のフォントサイズ

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
  const scaledRotateHandleSize = ROTATE_HANDLE_SIZE / view.scale;
  const body = expandRect(shape.rect, scaledPadding);
  const corners = cornerPoints(body);

  // 図形の中心点を計算
  const centerX = body.x + body.width / 2;
  const centerY = body.y + body.height / 2;

  // 回転円の半径を計算（図形の幅と高さの平均値の半分）
  const radius = Math.max(body.width, body.height) / Math.SQRT2;

  // 回転ハンドルの位置を計算（円周上の角度位置）
  const angleRad = (body.angle * Math.PI) / 180;
  const handleX = centerX + radius * Math.cos(angleRad);
  const handleY = centerY + radius * Math.sin(angleRad);

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

  // 回転円と回転ハンドルの情報を追加
  const rotateCircle = {
    center: { x: centerX, y: centerY },
    radius: radius,
  };

  const rotateHandle = {
    center: { x: handleX, y: handleY },
    rect: {
      ...rectFromPointAndPadding({ x: handleX, y: handleY }, scaledRotateHandleSize / 2),
      angle: body.angle,
    },
  };

  return { body, handles, rotateCircle, rotateHandle };
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
  const scaledFontSize = ANGLE_FONT_SIZE / view.scale;

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

  // 回転円を描画
  ctx.beginPath();
  ctx.strokeStyle = ROTATE_CIRCLE_COLOR;
  ctx.lineWidth = scaledStrokeWidth;
  ctx.arc(
    boundingBox.rotateCircle.center.x,
    boundingBox.rotateCircle.center.y,
    boundingBox.rotateCircle.radius,
    0,
    2 * Math.PI
  );
  ctx.stroke();

  // 中心から回転ハンドルまでの点線を描画
  const { center: circleCenter } = boundingBox.rotateCircle;
  const { center: handleCenter } = boundingBox.rotateHandle;

  ctx.beginPath();
  ctx.strokeStyle = ROTATE_CIRCLE_COLOR;
  ctx.setLineDash([3 / view.scale, 3 / view.scale]); // 点線のパターンをスケールに合わせて調整
  ctx.moveTo(circleCenter.x, circleCenter.y);
  ctx.lineTo(handleCenter.x, handleCenter.y);
  ctx.stroke();
  ctx.setLineDash([]); // 点線をリセット

  // 回転角度を表示
  ctx.font = `${scaledFontSize}px Arial`;
  ctx.fillStyle = BOX_STROKE_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 角度をラジアンに変換
  const angleRad = (box.angle * Math.PI) / 180;

  // 中心から少し離れた位置に角度を表示
  const angleOffsetDistance = boundingBox.rotateCircle.radius * 0.3; // 中心から30%の位置
  const angleOffsetX = circleCenter.x + angleOffsetDistance * Math.cos(angleRad);
  const angleOffsetY = circleCenter.y + angleOffsetDistance * Math.sin(angleRad);

  // テキストの回転を打ち消すために、一時的に座標変換を保存して回転を元に戻す
  ctx.save();
  // 図形の回転とviewの回転を打ち消す
  ctx.translate(circleCenter.x, circleCenter.y);
  //  ctx.rotate(-(box.angle * Math.PI) / 180);
  ctx.rotate(-(view.angle * Math.PI) / 180);
  ctx.translate(-circleCenter.x, -circleCenter.y);

  // 回転を打ち消した状態で、同じ位置にテキストを描画
  ctx.fillText(`${box.angle.toFixed(2)}°`, angleOffsetX, angleOffsetY);

  // 座標変換を元に戻す
  ctx.restore();

  // 回転ハンドルを描画（丸に変更）
  ctx.fillStyle = ROTATE_HANDLE_FILL_COLOR;
  ctx.strokeStyle = HANDLE_STROKE_COLOR;
  ctx.lineWidth = scaledHandleStrokeWidth;

  const { center: rotateHandleCenter } = boundingBox.rotateHandle;
  const rotateHandleRadius = ROTATE_HANDLE_SIZE / (2 * view.scale);

  ctx.beginPath();
  ctx.arc(rotateHandleCenter.x, rotateHandleCenter.y, rotateHandleRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

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
): ResizeHandle | RotateHandle | undefined => {
  // バウンディングボックスの情報を取得
  const boundingBox = boundingBoxForShape(shape, view);

  // 回転円周上をチェック
  const { center: circleCenter, radius } = boundingBox.rotateCircle;
  const distance = Math.sqrt(
    (circleCenter.x - canvasPoint.x) ** 2 + (circleCenter.y - canvasPoint.y) ** 2
  );

  const tolerance = ROTATE_CIRCLE_TOLERANCE / view.scale; // 円周の許容範囲
  if (Math.abs(distance - radius) <= tolerance) {
    return 'rotate';
  }

  // 各リサイズハンドルをチェック
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
