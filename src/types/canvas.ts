import type { ViewCoord } from "../state/viewState";

/**
 * タッチ操作の座標情報
 */
export type Touch = {
	/** タッチの識別子 */
	identifier: number;
	/** X座標（ピクセル） */
	x: number;
	/** Y座標（ピクセル） */
	y: number;
};

/**
 * ジェスチャー操作の状態
 */
export type GestureState = {
	/** 現在のタッチ情報の配列 */
	touches: Touch[];
	/** ピンチ操作の中心座標 */
	center?: { x: number; y: number };
	/** ピンチ操作開始時のビュー状態 */
	initialView?: ViewCoord;
};

/**
 * キャンバスの描画イベント
 */
export type CanvasRenderEvent = {
	/** 描画コンテキスト */
	ctx: CanvasRenderingContext2D;
	/** キャンバスの幅 */
	width: number;
	/** キャンバスの高さ */
	height: number;
	/** 現在のビュー状態 */
	view: ViewCoord;
};

/**
 * キャンバスのタッチイベント
 */
export type CanvasTouchEvent = {
	/** タッチ座標（ビュー座標系） */
	point: { x: number; y: number };
	/** 元のタッチイベント */
	event: TouchEvent;
};

/**
 * Canvasコンポーネントのプロパティ
 */
export type CanvasProps = {
	/** グリッドのサイズ（ピクセル） デフォルト: 200 */
	gridSize?: number;
	/** グリッドを表示するか デフォルト: true */
	showGrid?: boolean;
	/** タッチ操作の視覚的フィードバックを表示するか デフォルト: false */
	showGesture?: boolean;
	/**
	 * スクロール・ズーム・回転のジェスチャーを有効にするか？
	 * デフォルト: true
	 * 無効にした場合、onTouch*イベントは発火しますが、座標系の変更は行われません。
	 */
	enableGuesture?: boolean;
	/** キャンバスの描画処理 */
	onRender?: (e: CanvasRenderEvent) => void;
	/** シングルタッチ開始時の処理 */
	onTouchStart?: (e: CanvasTouchEvent) => void;
	/** シングルタッチ移動時の処理 */
	onTouchMove?: (e: CanvasTouchEvent) => void;
	/** シングルタッチ終了時の処理 */
	onTouchEnd?: (e: CanvasTouchEvent) => void;
};
