import type { ViewCoord } from '../../state/viewState';
import type { Snap } from '../../types/snap';

/** スナップの許容誤差 */
const SNAP_TOLERANCE = 8;
/** スナップの色 */
const SNAP_COLOR = '#cf6b00';
/** スナップの線幅 */
const SNAP_LINE_WIDTH = 1;
/** 点スナップの半径 */
const POINT_SNAP_RADIUS = 3;

/**
 * スナップを描画
 * @param ctx - キャンバスのコンテキスト
 * @param snaps - スナップの配列
 * @param view - 描画座標系
 */
export const drawSnaps = (ctx: CanvasRenderingContext2D, snaps: Snap[], view: ViewCoord) => {
  if (snaps.length === 0) return;

  // 描画スタイルの設定
  ctx.strokeStyle = SNAP_COLOR;
  ctx.fillStyle = SNAP_COLOR;

  // 各スナップを描画
  for (const snap of snaps) {
    switch (snap.kind) {
      case 'x':
        drawXSnap(ctx, snap, view);
        break;
      case 'y':
        drawYSnap(ctx, snap, view);
        break;
      case 'point':
        drawPointSnap(ctx, snap, view);
        break;
      case 'line':
        drawLineSnap(ctx, snap, view);
        break;
    }
  }
};

/**
 * X軸スナップを描画
 * @param ctx - キャンバスのコンテキスト
 * @param snap - X軸スナップ
 * @param view - 描画座標系
 */
const drawXSnap = (ctx: CanvasRenderingContext2D, snap: Snap & { kind: 'x' }, view: ViewCoord) => {
  const { value } = snap;

  // 現在の変換を保存
  ctx.save();

  // ビュー変換を適用
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // 線の設定
  ctx.setLineDash([2 / view.scale, 2 / view.scale]);
  ctx.lineWidth = SNAP_LINE_WIDTH / view.scale;

  // キャンバスの高さを取得（スケールで調整）
  const canvasHeight = ctx.canvas.height / view.scale;

  // 垂直線を描画
  ctx.beginPath();
  ctx.moveTo(value, -canvasHeight);
  ctx.lineTo(value, canvasHeight);
  ctx.stroke();

  // 変換を元に戻す
  ctx.restore();
};

/**
 * Y軸スナップを描画
 * @param ctx - キャンバスのコンテキスト
 * @param snap - Y軸スナップ
 * @param view - 描画座標系
 */
const drawYSnap = (ctx: CanvasRenderingContext2D, snap: Snap & { kind: 'y' }, view: ViewCoord) => {
  const { value } = snap;

  // 現在の変換を保存
  ctx.save();

  // ビュー変換を適用
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // 線の設定
  ctx.setLineDash([2 / view.scale, 2 / view.scale]);
  ctx.lineWidth = SNAP_LINE_WIDTH / view.scale;

  // キャンバスの幅を取得（スケールで調整）
  const canvasWidth = ctx.canvas.width / view.scale;

  // 水平線を描画
  ctx.beginPath();
  ctx.moveTo(-canvasWidth, value);
  ctx.lineTo(canvasWidth, value);
  ctx.stroke();

  // 変換を元に戻す
  ctx.restore();
};

/**
 * 点スナップを描画
 * @param ctx - キャンバスのコンテキスト
 * @param snap - 点スナップ
 * @param view - 描画座標系
 */
const drawPointSnap = (
  ctx: CanvasRenderingContext2D,
  snap: Snap & { kind: 'point' },
  view: ViewCoord
) => {
  const { p } = snap;

  // 現在の変換を保存
  ctx.save();

  // ビュー変換を適用
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // 点を描画（塗りつぶしの円）
  ctx.beginPath();
  ctx.arc(p.x, p.y, POINT_SNAP_RADIUS / view.scale, 0, Math.PI * 2);
  ctx.fill();

  // 許容範囲を点線で描画
  ctx.beginPath();
  ctx.setLineDash([2 / view.scale, 2 / view.scale]);
  ctx.lineWidth = SNAP_LINE_WIDTH / view.scale;
  ctx.arc(p.x, p.y, SNAP_TOLERANCE / view.scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]); // 点線をリセット

  // 変換を元に戻す
  ctx.restore();
};

/**
 * 直線スナップを描画
 * @param ctx - キャンバスのコンテキスト
 * @param snap - 直線スナップ
 * @param view - 描画座標系
 */
const drawLineSnap = (
  ctx: CanvasRenderingContext2D,
  snap: Snap & { kind: 'line' },
  view: ViewCoord
) => {
  const { p1, p2 } = snap;

  // 現在の変換を保存
  ctx.save();

  // ビュー変換を適用
  ctx.translate(view.offsetX, view.offsetY);
  ctx.rotate((view.angle * Math.PI) / 180);
  ctx.scale(view.scale, view.scale);

  // 線の設定
  ctx.setLineDash([2 / view.scale, 2 / view.scale]);
  ctx.lineWidth = SNAP_LINE_WIDTH / view.scale;

  // 直線の方向ベクトル
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  // 直線の長さ
  const length = Math.sqrt(dx * dx + dy * dy);

  // 単位ベクトル
  const ux = dx / length;
  const uy = dy / length;

  // キャンバスの対角線の長さ（十分長い線を描画するため）
  const canvasDiagonal = Math.sqrt(
    (ctx.canvas.width / view.scale) ** 2 + (ctx.canvas.height / view.scale) ** 2
  );

  // 十分長い線分の端点
  const extendedP1 = {
    x: p1.x - ux * canvasDiagonal,
    y: p1.y - uy * canvasDiagonal,
  };

  const extendedP2 = {
    x: p1.x + ux * canvasDiagonal,
    y: p1.y + uy * canvasDiagonal,
  };

  // 線を描画
  ctx.beginPath();
  ctx.moveTo(extendedP1.x, extendedP1.y);
  ctx.lineTo(extendedP2.x, extendedP2.y);
  ctx.stroke();

  // 変換を元に戻す
  ctx.restore();
};
