import { atom } from "jotai";
import type { Stroke, StrokePoint } from "../types/paint";

/**
 * 確定済みのストローク一覧
 * @private
 */
const strokesAtom = atom<Stroke[]>([]);

/**
 * 入力中のストローク
 * @private
 */
const inputStrokeAtom = atom<Stroke | undefined>(undefined);

/**
 * 全てのストローク（確定済み + 入力中）
 */
export const allStrokesAtom = atom((get) => {
	const strokes = get(strokesAtom);
	const inputStroke = get(inputStrokeAtom);
	return inputStroke ? [...strokes, inputStroke] : strokes;
});

/**
 * ストロークの入力を開始
 */
export const beginStrokeAction = atom(
	undefined, // read
	(get, set) => {
		// 新しい空のストロークを作成
		set(inputStrokeAtom, { points: [] });
	},
);

/**
 * ストロークに座標を追加
 */
export const addStrokePointAction = atom(
	undefined, // read
	(get, set, point: StrokePoint) => {
		const inputStroke = get(inputStrokeAtom);
		if (!inputStroke) return;

		// 既存の点に新しい点を追加
		set(inputStrokeAtom, {
			points: [...inputStroke.points, point],
		});
	},
);

/**
 * ストロークを確定
 */
export const commitStrokeAction = atom(
	undefined, // read
	(get, set) => {
		const inputStroke = get(inputStrokeAtom);
		if (!inputStroke) return;

		// 入力中のストロークを確定済みストロークに追加
		set(strokesAtom, (prev) => [...prev, inputStroke]);
		// 入力中のストロークをクリア
		set(inputStrokeAtom, undefined);
	},
);

/**
 * ストロークをキャンセル
 */
export const cancelStrokeAction = atom(
	undefined, // read
	(get, set) => {
		// 入力中のストロークをクリア
		set(inputStrokeAtom, undefined);
	},
);

/**
 * ストロークをクリア
 */
export const clearStrokesAction = atom(
	undefined, // read
	(get, set) => {
		set(strokesAtom, []);
		set(inputStrokeAtom, undefined);
	},
);
