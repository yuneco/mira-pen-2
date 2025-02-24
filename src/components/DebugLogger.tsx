import { useAtomValue } from "jotai";
import { debugLogAtom } from "../state/debugLogState";

export const DebugLogger = () => {
	const message = useAtomValue(debugLogAtom);

	if (!message) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: 8,
				left: 8,
				right: 8,
				padding: "8px",
				background: "rgba(0, 0, 0, 0.6)",
				color: "white",
				fontSize: "12px",
				fontFamily: "monospace",
				borderRadius: "4px",
				pointerEvents: "none",
				zIndex: 1000,
				whiteSpace: "pre-wrap",
				maxHeight: "100px",
				overflow: "auto",
			}}
		>
			{message}
		</div>
	);
};
