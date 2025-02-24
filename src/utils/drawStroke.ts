import type { Stroke } from "../types/paint";
import type { ViewCoord } from "../state/viewState";

export const drawStroke = (
	ctx: CanvasRenderingContext2D,
	stroke: Stroke,
	view: ViewCoord,
) => {
	if (stroke.points.length === 0) return;

	// 座標変換行列を適用
	ctx.save();
	ctx.translate(view.offsetX, view.offsetY);
	ctx.rotate((view.angle * Math.PI) / 180);
	ctx.scale(view.scale, view.scale);

	// ストロークの描画
	ctx.beginPath();
	ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
	for (let i = 1; i < stroke.points.length; i++) {
		ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
	}
	ctx.strokeStyle = "black";
	ctx.lineWidth = 4;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	ctx.stroke();

	ctx.restore();
};
