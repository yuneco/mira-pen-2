import type { DoubleTouchGesture } from "../types/canvas";
import type { ViewCoord } from "../state/viewState";

/**
 * 2点間の距離を計算
 * @param t1 - 1つ目の点の座標
 * @param t2 - 2つ目の点の座標
 * @returns 2点間の距離
 */
export const getDistance = (
	t1: { x: number; y: number },
	t2: { x: number; y: number },
): number => {
	const dx = t1.x - t2.x;
	const dy = t1.y - t2.y;
	return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 2点間の角度を計算（度数法）
 * @param t1 - 1つ目の点の座標
 * @param t2 - 2つ目の点の座標
 * @returns 2点間の角度（度数法）
 */
export const getAngle = (
	t1: { x: number; y: number },
	t2: { x: number; y: number },
): number => {
	return (Math.atan2(t2.y - t1.y, t2.x - t1.x) * 180) / Math.PI;
};

/**
 * ピンチジェスチャーをビューに適用する関数
 * @param prev - 前回のジェスチャー状態
 * @param newTouches - 新しいタッチ座標
 * @param currentView - 現在のビュー状態
 * @returns 更新されたビュー状態と中心点
 */
export const applyPinchGestureToView = (
	prev: DoubleTouchGesture,
	newTouches: readonly [{ x: number; y: number }, { x: number; y: number }],
	currentView: ViewCoord,
): { view: ViewCoord; center: { x: number; y: number } } => {
	// 新しい中心点を計算
	const newCenter = {
		x: (newTouches[0].x + newTouches[1].x) / 2,
		y: (newTouches[0].y + newTouches[1].y) / 2,
	};

	// 中心点の移動量を計算（ドラッグ操作分）
	const centerDx = newCenter.x - prev.center.x;
	const centerDy = newCenter.y - prev.center.y;

	// スケールと角度の計算
	const oldDist = getDistance(prev.touches[0], prev.touches[1]);
	const newDist = getDistance(newTouches[0], newTouches[1]);
	const scaleDiff = newDist / oldDist;
	const scale = currentView.scale * scaleDiff;

	const oldAngle = getAngle(prev.touches[0], prev.touches[1]);
	const newAngle = getAngle(newTouches[0], newTouches[1]);
	const angleDiff = newAngle - oldAngle;
	const angle = currentView.angle + angleDiff;

	// 回転前の中心点のビュー座標
	const rad = (currentView.angle * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const dx = newCenter.x - currentView.offsetX - centerDx;
	const dy = newCenter.y - currentView.offsetY - centerDy;
	const currentCenterX = (dx * cos + dy * sin) / currentView.scale;
	const currentCenterY = (-dx * sin + dy * cos) / currentView.scale;

	// 新しい変換後の中心点の位置
	const newRad = (angle * Math.PI) / 180;
	const newCos = Math.cos(newRad);
	const newSin = Math.sin(newRad);
	const newCenterX = currentCenterX * scale;
	const newCenterY = currentCenterY * scale;
	const newDx = newCenterX * newCos - newCenterY * newSin;
	const newDy = newCenterX * newSin + newCenterY * newCos;

	// 中心点が同じ画面位置になるようにオフセットを計算（ドラッグ分を加算）
	const offsetX = newCenter.x - newDx;
	const offsetY = newCenter.y - newDy;

	return {
		view: { ...currentView, scale, angle, offsetX, offsetY },
		center: newCenter,
	};
};
