import type { ViewCoord } from '../state/viewState';
import type { Shape } from '../types/shape';

export const drawShapes = (ctx: CanvasRenderingContext2D, shapes: Shape[], view: ViewCoord) => {
  if (shapes.length === 0) return;

  for (const shape of shapes) {
    // 座標変換行列を適用
    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.rotate((view.angle * Math.PI) / 180);
    ctx.scale(view.scale, view.scale);

    // シェイプの描画
    ctx.beginPath();

    // シェイプのタイプに応じた描画処理
    const { x, y, width, height, angle } = shape.rect;
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

    // スタイルの適用
    const { strokeColor, strokeWidth, fillColor } = shape.style;

    // 塗りつぶし
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // 線の描画
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    ctx.restore();
  }
};
