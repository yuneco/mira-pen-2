import type { ViewCoord } from '../state/viewState';
import type { Point } from '../types/coord';

// ビュー座標からキャンバス座標への変換関数を追加
export const viewToCanvas = (pointView: Point, view: ViewCoord) => {
  // 逆変換行列を適用
  const dx = pointView.x - view.offsetX;
  const dy = pointView.y - view.offsetY;
  const rad = (-view.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: (dx * cos - dy * sin) / view.scale,
    y: (dx * sin + dy * cos) / view.scale,
  };
};

export const canvasToView = (pointCanvas: Point, view: ViewCoord) => {
  // 変換行列を適用
  const x = pointCanvas.x * view.scale * Math.cos((view.angle * Math.PI) / 180) + view.offsetX;
  const y = pointCanvas.y * view.scale * Math.sin((view.angle * Math.PI) / 180) + view.offsetY;
  return { x, y };
};
