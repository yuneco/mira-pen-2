import { expandRect } from '../coordinates/coordUtils';
import type { ViewCoord } from '../state/viewState';
import type { Shape } from '../types/shape';

export type DrawOption = {
  /** フォーカスしている図形のID */
  snapFocusShapeIds: string[];
  /** スナップ対象の図形のID */
  snapTargetShapeIds: string[];
};

const SNAP_FOCUS_STROKE_COLOR = '#0000FF';
const SNAP_FOCUS_FILL_COLOR = '#0000FF44';
const SNAP_FOCUS_STROKE_WIDTH = 1;

const SNAP_TARGET_STROKE_COLOR = '#cf6b00';
const SNAP_TARGET_STROKE_WIDTH = 2;

export const drawShapes = (
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  view: ViewCoord,
  options: Partial<DrawOption>
) => {
  if (shapes.length === 0) return;

  const snapFocusShapeIds = options.snapFocusShapeIds ?? [];
  const snapTargetShapeIds = options.snapTargetShapeIds ?? [];

  for (const shape of shapes) {
    // 幅と高さが0以下の図形は描画しない
    if (shape.rect.width <= 0 || shape.rect.height <= 0) {
      continue;
    }

    // 座標変換行列を適用
    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.rotate((view.angle * Math.PI) / 180);
    ctx.scale(view.scale, view.scale);

    // シェイプの描画
    ctx.beginPath();

    // シェイプのタイプに応じた描画処理: 線が領域の外にはみ出さないよう、線幅の半分だけ縮小する
    const { strokeColor, strokeWidth, fillColor } = shape.style;
    const { x, y, width, height, angle } = expandRect(shape.rect, -strokeWidth / 2);

    // 縮小後の幅と高さが0以下になった場合は描画しない
    if (width <= 0 || height <= 0) {
      ctx.restore();
      continue;
    }

    // 図形の中心点を原点に移動
    ctx.translate(x + width / 2, y + height / 2);
    // 図形の回転を適用
    ctx.rotate((angle * Math.PI) / 180);

    if (shape.kind === 'rect') {
      // 中心が原点になるように調整して描画
      ctx.rect(-width / 2, -height / 2, width, height);
    } else if (shape.kind === 'oval') {
      // 楕円を原点中心に描画
      ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    }

    // 塗りつぶし
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // 線の描画
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // フォーカスしている図形の場合は枠線を太くする
    if (snapFocusShapeIds.includes(shape.id)) {
      ctx.lineWidth = SNAP_FOCUS_STROKE_WIDTH;
      ctx.strokeStyle = SNAP_FOCUS_STROKE_COLOR;
      ctx.fillStyle = SNAP_FOCUS_FILL_COLOR;
      ctx.fill();
      ctx.stroke();
    }

    // スナップ対象の図形の場合は枠線追加
    if (snapTargetShapeIds.includes(shape.id)) {
      ctx.lineWidth = SNAP_TARGET_STROKE_WIDTH;
      ctx.strokeStyle = SNAP_TARGET_STROKE_COLOR;
      ctx.stroke();
    }

    ctx.restore();
  }
};
