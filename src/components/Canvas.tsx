import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { viewStateAtom, viewDprAtom } from "../state/viewState";
import type { CanvasProps, GestureState, Touch } from "../types/canvas";
import { drawGrid } from "../utils/drawGrid";
import { GestureDebugger } from "./GestureDebugger";
import { DebugLogger } from "./DebugLogger";
import { debugLog } from "../state/debugLogState";
import { drawGesture } from "../utils/drawGesture";

export const Canvas: FC<CanvasProps> = ({
	gridSize = 200,
	showGrid = true,
	showGesture = true,
	enableGuesture = true,
	redrawTrigger,
	onRender,
	onTouchStart,
	onTouchMove,
	onTouchEnd,
	onGuestureStart,
}) => {
	useAtomValue(redrawTrigger);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [dpr] = useAtom(viewDprAtom);
	const [view, setView] = useAtom(viewStateAtom);
	const [gesture, setGesture] = useState<GestureState>({ touches: [] });

	// キャンバスの描画更新
	const updateCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const width = window.innerWidth;
		const height = window.innerHeight;

		canvas.width = width * dpr;
		canvas.height = height * dpr;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.scale(dpr, dpr);

		// グリッドの描画
		if (showGrid) {
			drawGrid(ctx, width, height, gridSize, view);
		}

		// カスタム描画処理
		onRender?.({ ctx, width, height, view });

		// ジェスチャーの視覚的フィードバック
		if (showGesture) {
			drawGesture(
				ctx,
				gesture.touches,
				gesture.touches.length === 2 ? gesture.center : undefined,
				dpr,
			);
		}
	}, [dpr, view, gesture, gridSize, showGrid, showGesture, onRender]);

	// 2点間の距離を計算
	const getDistance = useCallback((t1: Touch, t2: Touch) => {
		const dx = t1.x - t2.x;
		const dy = t1.y - t2.y;
		return Math.sqrt(dx * dx + dy * dy);
	}, []);

	// 2点間の角度を計算（度数法）
	const getAngle = useCallback((t1: Touch, t2: Touch) => {
		return (Math.atan2(t2.y - t1.y, t2.x - t1.x) * 180) / Math.PI;
	}, []);

	// ビュー座標からキャンバス座標への変換関数を追加
	const viewToCanvas = useCallback(
		(pointView: { x: number; y: number }) => {
			// 逆変換行列を適用
			const dx = pointView.x - view.offsetX;
			const dy = pointView.y - view.offsetY;
			const rad = (-view.angle * Math.PI) / 180;
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			return {
				x: (dx * cos - dy * sin) / view.scale,
				y: (dx * sin + dy * cos) / view.scale,
			};
		},
		[view],
	);

	// タッチ開始時の処理
	const handleTouchStart = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const newTouches = Array.from(e.touches).map((t) => ({
				identifier: t.identifier,
				x: t.clientX,
				y: t.clientY,
			}));

			// シングルタッチの場合はカスタムハンドラを呼び出し
			if (newTouches.length === 1) {
				const pointView = { x: newTouches[0].x, y: newTouches[0].y };
				onTouchStart?.({
					pointView,
					pointCanvas: viewToCanvas(pointView),
					event: e,
				});
			}

			if (enableGuesture === true || enableGuesture === "multi-touch-only") {
				setGesture(() => {
					// 2点のタッチが検出された場合（1→2の遷移または0→2の遷移）
					if (newTouches.length === 2) {
						const center = {
							x: (newTouches[0].x + newTouches[1].x) / 2,
							y: (newTouches[0].y + newTouches[1].y) / 2,
						};
						// ジェスチャー開始イベントを発火
						onGuestureStart?.({
							pointView: center,
							pointCanvas: viewToCanvas(center),
							event: e,
						});
						return {
							touches: newTouches,
							center,
							initialView: view,
						};
					}
					return { touches: newTouches };
				});
			} else {
				setGesture({ touches: newTouches });
			}
		},
		[view, onTouchStart, enableGuesture, viewToCanvas, onGuestureStart],
	);

	// タッチ移動時の処理
	const handleTouchMove = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const newTouches = Array.from(e.touches).map((t) => ({
				identifier: t.identifier,
				x: t.clientX,
				y: t.clientY,
			}));

			// シングルタッチの場合はカスタムハンドラを呼び出し
			if (newTouches.length === 1) {
				const pointView = { x: newTouches[0].x, y: newTouches[0].y };
				onTouchMove?.({
					pointView,
					pointCanvas: viewToCanvas(pointView),
					event: e,
				});
			}

			if (enableGuesture === true || enableGuesture === "multi-touch-only") {
				setGesture((prev) => {
					// 単純なドラッグ操作（multi-touch-onlyの場合は無効）
					if (
						enableGuesture === true &&
						prev.touches.length === 1 &&
						newTouches.length === 1
					) {
						const dx = (newTouches[0].x - prev.touches[0].x) / 2;
						const dy = (newTouches[0].y - prev.touches[0].y) / 2;
						// ジェスチャー開始イベントを発火
						onGuestureStart?.({
							pointView: { x: newTouches[0].x, y: newTouches[0].y },
							pointCanvas: viewToCanvas({
								x: newTouches[0].x,
								y: newTouches[0].y,
							}),
							event: e,
						});
						setView((v) => ({
							...v,
							offsetX: v.offsetX + dx,
							offsetY: v.offsetY + dy,
						}));
						return { touches: newTouches };
					}

					// ピンチ操作（スケール、回転、ドラッグ）
					if (
						prev.touches.length === 2 &&
						newTouches.length === 2 &&
						prev.center &&
						prev.initialView
					) {
						// 新しい中心点を計算
						const newCenter = {
							x: (newTouches[0].x + newTouches[1].x) / 2,
							y: (newTouches[0].y + newTouches[1].y) / 2,
						};

						// 中心点の移動量を計算（ドラッグ操作分）
						const centerDx = newCenter.x - prev.center.x;
						const centerDy = newCenter.y - prev.center.y;

						// スケールと角度の計算
						const oldDist = getDistance(prev.touches[0], prev.touches[1]);
						const newDist = getDistance(newTouches[0], newTouches[1]);
						const scaleDiff = newDist / oldDist;
						const scale = view.scale * scaleDiff;

						const oldAngle = getAngle(prev.touches[0], prev.touches[1]);
						const newAngle = getAngle(newTouches[0], newTouches[1]);
						const angleDiff = newAngle - oldAngle;
						const angle = view.angle + angleDiff;

						// 回転前の中心点のビュー座標
						const rad = (view.angle * Math.PI) / 180;
						const cos = Math.cos(rad);
						const sin = Math.sin(rad);
						const dx = newCenter.x - view.offsetX - centerDx;
						const dy = newCenter.y - view.offsetY - centerDy;
						const currentCenterX = (dx * cos + dy * sin) / view.scale;
						const currentCenterY = (-dx * sin + dy * cos) / view.scale;

						// 新しい変換後の中心点の位置
						const newRad = (angle * Math.PI) / 180;
						const newCos = Math.cos(newRad);
						const newSin = Math.sin(newRad);
						const newCenterX = currentCenterX * scale;
						const newCenterY = currentCenterY * scale;
						const newDx = newCenterX * newCos - newCenterY * newSin;
						const newDy = newCenterX * newSin + newCenterY * newCos;

						// 中心点が同じ画面位置になるようにオフセットを計算（ドラッグ分を加算）
						const offsetX = newCenter.x - newDx;
						const offsetY = newCenter.y - newDy;

						debugLog(
							`center: (${Math.round(newCenter.x)}, ${Math.round(newCenter.y)})`,
						);

						// ジェスチャー開始イベントを発火
						onGuestureStart?.({
							pointView: newCenter,
							pointCanvas: viewToCanvas(newCenter),
							event: e,
						});
						setView({ ...view, scale, angle, offsetX, offsetY });
						return { ...prev, touches: newTouches, center: newCenter };
					}

					return { touches: newTouches };
				});
			} else {
				setGesture({ touches: newTouches });
			}
		},
		[
			getAngle,
			getDistance,
			setView,
			view,
			onTouchMove,
			enableGuesture,
			viewToCanvas,
			onGuestureStart,
		],
	);

	// タッチ終了時の処理
	const handleTouchEnd = useCallback(
		(e: TouchEvent) => {
			e.preventDefault();
			const newTouches = Array.from(e.touches).map((t) => ({
				identifier: t.identifier,
				x: t.clientX,
				y: t.clientY,
			}));

			// シングルタッチからタッチなしになった場合はカスタムハンドラを呼び出し
			if (gesture.touches.length === 1 && newTouches.length === 0) {
				const pointView = { x: gesture.touches[0].x, y: gesture.touches[0].y };
				onTouchEnd?.({
					pointView,
					pointCanvas: viewToCanvas(pointView),
					event: e,
				});
			}

			setGesture({ touches: newTouches });
		},
		[gesture.touches, onTouchEnd, viewToCanvas],
	);

	// イベントリスナーの設定
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchmove", handleTouchMove);
		canvas.addEventListener("touchend", handleTouchEnd);
		canvas.addEventListener("touchcancel", handleTouchEnd);

		return () => {
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchmove", handleTouchMove);
			canvas.removeEventListener("touchend", handleTouchEnd);
			canvas.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [handleTouchEnd, handleTouchMove, handleTouchStart]);

	// キャンバスの更新
	useEffect(() => {
		updateCanvas();
		window.addEventListener("resize", updateCanvas);
		return () => window.removeEventListener("resize", updateCanvas);
	}, [updateCanvas]);

	return (
		<>
			<canvas
				ref={canvasRef}
				style={{
					position: "fixed",
					top: 0,
					left: 0,
					width: "100vw",
					height: "100dvh",
					touchAction: "none", // タッチイベントの既定の動作を無効化
				}}
			/>
			<GestureDebugger gesture={gesture} />
			<DebugLogger />
		</>
	);
};
