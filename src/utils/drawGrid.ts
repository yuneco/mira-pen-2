import { DEFAULT_VIEW_STATE, type ViewCoord } from '../state/viewState';

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize = 200,
  view: ViewCoord = DEFAULT_VIEW_STATE
) {
  // キャンバスのクリア
  ctx.clearRect(0, 0, width, height);

  // 座標変換の保存
  ctx.save();

  // ビューの変換を適用
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);
  ctx.rotate((view.angle * Math.PI) / 180);

  // 回転を考慮した描画範囲の計算
  const rad = (view.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 画面の四隅の座標をビュー座標系に変換
  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ].map((p) => {
    const dx = p.x - view.offsetX;
    const dy = p.y - view.offsetY;
    return {
      x: (dx * cos + dy * sin) / view.scale,
      y: (-dx * sin + dy * cos) / view.scale,
    };
  });

  // 描画範囲の境界を計算
  const startX = Math.min(...corners.map((p) => p.x));
  const endX = Math.max(...corners.map((p) => p.x));
  const startY = Math.min(...corners.map((p) => p.y));
  const endY = Math.max(...corners.map((p) => p.y));

  // 小グリッドの描画
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1 / view.scale;
  const smallGridSize = gridSize / 4;

  ctx.beginPath();
  // 縦線
  for (let x = Math.floor(startX / smallGridSize) * smallGridSize; x <= endX; x += smallGridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  // 横線
  for (let y = Math.floor(startY / smallGridSize) * smallGridSize; y <= endY; y += smallGridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // 大グリッドの描画
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1.5 / view.scale;

  ctx.beginPath();
  // 縦線
  for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  // 横線
  for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // 軸の描画
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2 / view.scale;

  ctx.beginPath();
  // Y軸
  ctx.moveTo(0, startY);
  ctx.lineTo(0, endY);
  // X軸
  ctx.moveTo(startX, 0);
  ctx.lineTo(endX, 0);
  ctx.stroke();

  // テキストの描画（座標変換の影響を受けないように一時的に解除）
  ctx.restore();
  ctx.save();

  // テキストの位置をビューの変換に合わせて計算
  const transformedOrigin = transformPoint(0, 0, view);
  const transformedEndX = transformPoint(endX, 0, view);

  ctx.fillStyle = 'red';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // "Y"の描画
  ctx.fillText('Y', transformedOrigin.x, 20);

  // "X"の描画
  ctx.fillText('X', transformedEndX.x - 20, transformedOrigin.y);

  ctx.restore();
}

// ポイントの座標変換を行うヘルパー関数
function transformPoint(x: number, y: number, view: ViewCoord) {
  // 回転の変換
  const rad = (view.angle * Math.PI) / 180;
  const rotatedX = x * Math.cos(rad) - y * Math.sin(rad);
  const rotatedY = x * Math.sin(rad) + y * Math.cos(rad);

  // スケールとオフセットの適用
  return {
    x: rotatedX * view.scale + view.offsetX,
    y: rotatedY * view.scale + view.offsetY,
  };
}
