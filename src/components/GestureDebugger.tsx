import type { GestureState } from "../types/canvas";

type Props = {
	gesture: GestureState;
};

export const GestureDebugger = ({ gesture }: Props) => {
	return (
		<div
			style={{
				position: "fixed",
				top: 8,
				right: 8,
				padding: "8px",
				background: "rgba(0, 0, 0, 0.6)",
				color: "white",
				fontSize: "12px",
				fontFamily: "monospace",
				borderRadius: "4px",
				pointerEvents: "none",
				zIndex: 1000,
			}}
		>
			<div>touches: {gesture.touches.length}</div>
			{gesture.center && (
				<div>
					center: ({Math.round(gesture.center.x)},{" "}
					{Math.round(gesture.center.y)})
				</div>
			)}
			{gesture.initialView && (
				<>
					<div>initialView:</div>
					<div style={{ paddingLeft: "8px" }}>
						scale: {gesture.initialView.scale.toFixed(2)}
					</div>
					<div style={{ paddingLeft: "8px" }}>
						angle: {Math.round(gesture.initialView.angle)}°
					</div>
					<div style={{ paddingLeft: "8px" }}>
						offset: ({Math.round(gesture.initialView.offsetX)},{" "}
						{Math.round(gesture.initialView.offsetY)})
					</div>
				</>
			)}
		</div>
	);
};
