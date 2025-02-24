import { atom } from "jotai";
import { getDefaultStore } from "jotai/vanilla";

export const debugLogAtom = atom<string>("");

/**
 * デバッグログを表示する関数
 * @param msg 表示するメッセージ
 */
export const debugLog = (msg: string) => {
	const store = getDefaultStore();
	store.set(debugLogAtom, msg);
};
