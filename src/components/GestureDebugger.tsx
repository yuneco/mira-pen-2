import type { FC } from "react";
import type { GestureState } from "../types/canvas";

type GestureDebuggerProps = {
	gesture: GestureState;
};

export const GestureDebugger: FC<GestureDebuggerProps> = ({ gesture }) => {
	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				right: 0,
				padding: "8px",
				backgroundColor: "rgba(0, 0, 0, 0.7)",
				color: "white",
				fontFamily: "monospace",
				fontSize: "12px",
				zIndex: 1000,
				maxWidth: "300px",
				borderRadius: "0 0 0 8px",
			}}
		>
			<div style={{ fontWeight: "bold", marginBottom: "4px" }}>
				ジェスチャー状態:{" "}
				<span style={{ color: "#00ffcc" }}>{gesture.type}</span>
			</div>
			<div>タッチ数: {gesture.touches.length}</div>

			{gesture.touches.length > 0 && (
				<div style={{ marginTop: "4px" }}>
					<div>タッチ座標:</div>
					{gesture.touches.map((touch, index) => (
						<div key={touch.identifier} style={{ paddingLeft: "8px" }}>
							{index}: ({Math.round(touch.x)}, {Math.round(touch.y)})
						</div>
					))}
				</div>
			)}

			{gesture.type === "doubleTouch" && (
				<>
					<div style={{ marginTop: "4px" }}>
						中心点: ({Math.round(gesture.center.x)},{" "}
						{Math.round(gesture.center.y)})
					</div>
					<div style={{ marginTop: "4px" }}>
						<div>初期ビュー:</div>
						<div style={{ paddingLeft: "8px" }}>
							スケール: {gesture.initialView.scale.toFixed(2)}
						</div>
						<div style={{ paddingLeft: "8px" }}>
							角度: {Math.round(gesture.initialView.angle)}°
						</div>
						<div style={{ paddingLeft: "8px" }}>
							オフセット: ({Math.round(gesture.initialView.offsetX)},{" "}
							{Math.round(gesture.initialView.offsetY)})
						</div>
					</div>
				</>
			)}

			{gesture.type === "singleTouch" && (
				<div style={{ marginTop: "4px", color: "#ffcc00" }}>
					ドラッグ操作が可能です
				</div>
			)}

			{gesture.type === "doubleTouch" && (
				<div style={{ marginTop: "4px", color: "#ffcc00" }}>
					ピンチ操作（ズーム・回転・ドラッグ）が可能です
				</div>
			)}
		</div>
	);
};
