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
    const { x, y, width, height } = shape.rect;
    if (shape.kind === 'rect') {
      ctx.rect(x, y, width, height);
    } else if (shape.kind === 'oval') {
      // 楕円の描画
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
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
