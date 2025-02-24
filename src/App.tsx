import { useState } from "react";
import "./App.css";
import { Canvas } from "./components/Canvas";
import { Toolbar } from "./components/Toolbar";
import type { Tool } from "./types/tool";

export const App = () => {
	const [currentTool, setCurrentTool] = useState<Tool>("hand");

	return (
		<>
			<div>
				<Canvas enableGuesture={currentTool === "hand"} />
				<Toolbar currentTool={currentTool} onToolChange={setCurrentTool} />
			</div>
		</>
	);
};
