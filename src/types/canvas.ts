import type { Atom } from 'jotai';
import type { ViewCoord } from '../state/viewState';

/**
 * 基本的なタッチ情報の型
 */
export type TouchPoint = {
  readonly identifier: number;
  readonly x: number;
  readonly y: number;
};

/**
 * アイドル状態
 */
export type IdleGesture = {
  readonly type: 'idle';
  readonly touches: readonly [];
};

/**
 * シングルタッチ状態
 */
export type SingleTouchGesture = {
  readonly type: 'singleTouch';
  readonly touches: readonly [TouchPoint];
};

/**
 * ダブルタッチ（ピンチ）ジェスチャー状態
 */
export type DoubleTouchGesture = {
  readonly type: 'doubleTouch';
  readonly touches: readonly [TouchPoint, TouchPoint];
  readonly center: { readonly x: number; readonly y: number };
  readonly initialView: ViewCoord;
};

/**
 * 統合型
 */
export type GestureState = IdleGesture | SingleTouchGesture | DoubleTouchGesture;

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
  pointView: { x: number; y: number };
  /** タッチ座標（キャンバス座標系） */
  pointCanvas: { x: number; y: number };
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
   * "multi-touch-only"にした場合、スクロール・ズーム・回転のジェスチャーは複数タッチのみで発火します。
   */
  enableGuesture?: boolean | 'multi-touch-only';
  /** 再描画のトリガーとなるatom。このatomの更新時にキャンバスが再描画され、onRenderが呼び出されます。 */
  redrawTrigger: Atom<unknown>;
  /** キャンバスの描画処理 */
  onRender?: (e: CanvasRenderEvent) => void;
  /** シングルタッチ開始時の処理 */
  onTouchStart?: (e: CanvasTouchEvent) => void;
  /** シングルタッチ移動時の処理 */
  onTouchMove?: (e: CanvasTouchEvent) => void;
  /** シングルタッチ終了時の処理 */
  onTouchEnd?: (e: CanvasTouchEvent) => void;
  /** ジェスチャー操作開始時の処理 */
  onGuestureStart?: (e: CanvasTouchEvent) => void;
  /** 2本目以降のタッチが開始された時の処理 */
  onMultiTouchStart?: (e: CanvasTouchEvent) => void;
};
