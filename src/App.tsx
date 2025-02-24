import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import "./App.css";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import type { Tool } from "./types/tool";
import {
	allStrokesAtom,
	beginStrokeAction,
	addStrokePointAction,
	commitStrokeAction,
	clearStrokesAction,
	cancelStrokeAction,
} from "./state/paintState";
import { drawStroke } from "./utils/drawStroke";

export const App = () => {
	const [currentTool, setCurrentTool] = useState<Tool>("hand");
	const beginStroke = useSetAtom(beginStrokeAction);
	const addStrokePoint = useSetAtom(addStrokePointAction);
	const commitStroke = useSetAtom(commitStrokeAction);
	const clearStrokes = useSetAtom(clearStrokesAction);
	const cancelStroke = useSetAtom(cancelStrokeAction);
	const strokes = useAtomValue(allStrokesAtom);

	return (
		<>
			<div>
				<Canvas
					enableGuesture={currentTool === "hand" ? true : "multi-touch-only"}
					redrawTrigger={allStrokesAtom}
					onRender={(e) => {
						// 全てのストロークを描画
						for (const stroke of strokes) {
							drawStroke(e.ctx, stroke, e.view);
						}
					}}
					onTouchStart={
						currentTool === "pen"
							? (e) => {
									beginStroke();
									addStrokePoint(e.pointCanvas);
								}
							: undefined
					}
					onTouchMove={
						currentTool === "pen"
							? (e) => {
									addStrokePoint(e.pointCanvas);
								}
							: undefined
					}
					onTouchEnd={
						currentTool === "pen"
							? () => {
									commitStroke();
								}
							: undefined
					}
					onGuestureStart={() => {
						// ストローク中にジェスチャー操作が開始されたらキャンセル
						cancelStroke();
					}}
				/>
				<Toolbar
					currentTool={currentTool}
					onToolChange={setCurrentTool}
					onClickClear={clearStrokes}
				/>
			</div>
		</>
	);
};
