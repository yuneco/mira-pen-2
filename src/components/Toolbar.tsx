import type { FC } from "react";
import type { Tool } from "../types/tool";

type Props = {
	currentTool: Tool;
	onToolChange: (tool: Tool) => void;
};

export const Toolbar: FC<Props> = ({ currentTool, onToolChange }) => {
	return (
		<div
			role="toolbar"
			aria-label="描画ツール"
			style={{
				position: "fixed",
				top: 8,
				left: 8,
				padding: "4px",
				background: "rgba(255, 255, 255, 0.9)",
				borderRadius: "4px",
				boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
				display: "flex",
				gap: "4px",
			}}
		>
			<div
				role="radiogroup"
				aria-label="ツール選択"
				style={{ display: "flex", gap: "4px" }}
			>
				<label
					style={{
						position: "relative",
						display: "inline-flex",
						padding: "8px",
						borderRadius: "4px",
						cursor: "pointer",
						background: currentTool === "pen" ? "#e0e0e0" : "transparent",
					}}
				>
					<input
						type="radio"
						name="tool"
						value="pen"
						checked={currentTool === "pen"}
						onChange={(e) => e.target.checked && onToolChange("pen")}
						style={{ position: "absolute", opacity: 0 }}
					/>
					<svg
						aria-hidden="true"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
					</svg>
					<span className="sr-only">ペンツール</span>
					{currentTool === "pen" && (
						<div
							aria-hidden="true"
							style={{
								position: "absolute",
								inset: -2,
								border: "2px solid #0066ff",
								borderRadius: "6px",
								pointerEvents: "none",
							}}
						/>
					)}
				</label>
				<label
					style={{
						position: "relative",
						display: "inline-flex",
						padding: "8px",
						borderRadius: "4px",
						cursor: "pointer",
						background: currentTool === "hand" ? "#e0e0e0" : "transparent",
					}}
				>
					<input
						type="radio"
						name="tool"
						value="hand"
						checked={currentTool === "hand"}
						onChange={(e) => e.target.checked && onToolChange("hand")}
						style={{ position: "absolute", opacity: 0 }}
					/>
					<svg
						aria-hidden="true"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
						<path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
						<path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
						<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
					</svg>
					<span className="sr-only">手のひらツール</span>
					{currentTool === "hand" && (
						<div
							aria-hidden="true"
							style={{
								position: "absolute",
								inset: -2,
								border: "2px solid #0066ff",
								borderRadius: "6px",
								pointerEvents: "none",
							}}
						/>
					)}
				</label>
			</div>
		</div>
	);
};
