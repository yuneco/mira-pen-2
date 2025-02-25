const GESTURE_COLOR = {
	fill: "rgba(255, 128, 0, 0.5)",
	stroke: "rgba(255, 128, 0, 0.8)",
	line: "rgba(255, 128, 0, 0.6)",
	center: "rgb(255, 128, 0)",
	text: "white",
} as const;

/**
 * ジェスチャー操作の視覚的フィードバックを描画
 * @param ctx - キャンバスの描画コンテキスト
 * @param touches - タッチ座標の配列
 * @param center - 中心点の座標
 * @param dpr - デバイスピクセル比
 */
export const drawGesture = (
	ctx: CanvasRenderingContext2D,
	touches: readonly { x: number; y: number }[],
	center?: { x: number; y: number },
	dpr = 1,
) => {
	if (touches.length === 0) return;
	// タッチポイントの描画
	ctx.save();
	ctx.resetTransform();
	ctx.scale(dpr, dpr);

	ctx.beginPath();
	ctx.moveTo(touches[0].x, touches[0].y);
	ctx.lineTo(touches[touches.length - 1].x, touches[touches.length - 1].y);
	ctx.strokeStyle = GESTURE_COLOR.line;
	ctx.lineWidth = 2;
	ctx.stroke();

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
};
