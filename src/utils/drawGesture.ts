import type { Touch } from "../types/canvas";

const GESTURE_COLOR = {
	fill: "rgba(255, 128, 0, 0.5)",
	stroke: "rgba(255, 128, 0, 0.8)",
	line: "rgba(255, 128, 0, 0.6)",
	center: "rgb(255, 128, 0)",
	text: "white",
} as const;

/**
 * ジェスチャー操作の視覚的フィードバックを描画
 */
export function drawGesture(
	ctx: CanvasRenderingContext2D,
	touches: Touch[],
	center?: { x: number; y: number },
	dpr = 1,
) {
	ctx.save();
	ctx.resetTransform();
	ctx.scale(dpr, dpr);

	// 2点のタッチ間の線を描画
	if (touches.length === 2) {
		ctx.beginPath();
		ctx.moveTo(touches[0].x, touches[0].y);
		ctx.lineTo(touches[1].x, touches[1].y);
		ctx.strokeStyle = GESTURE_COLOR.line;
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	// タッチ座標の描画
	touches.forEach((touch, index) => {
		// タッチポイントの円
		ctx.beginPath();
		ctx.arc(touch.x, touch.y, 12, 0, Math.PI * 2);
		ctx.fillStyle = GESTURE_COLOR.fill;
		ctx.fill();
		ctx.strokeStyle = GESTURE_COLOR.stroke;
		ctx.lineWidth = 2;
		ctx.stroke();

		// インデックスの表示
		ctx.fillStyle = GESTURE_COLOR.text;
		ctx.font = "bold 12px monospace";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(index.toString(), touch.x, touch.y);
	});

	// 中心点の描画
	if (center) {
		ctx.beginPath();
		ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
		ctx.fillStyle = GESTURE_COLOR.center;
		ctx.fill();
		ctx.strokeStyle = GESTURE_COLOR.center;
		ctx.lineWidth = 2;
		ctx.stroke();
	}

	ctx.restore();
}
