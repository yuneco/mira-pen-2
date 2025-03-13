import { applyPinchGestureToView } from "./gestureTransform";
import type { DoubleTouchGesture } from "../types/canvas";

describe("applyPinchGestureToView", () => {
	// 基準となる座標
	const BASE = {
		X1: 100,
		X2: 200,
		Y: 100,
		CENTER_X: 150,
	} as const;

	// 変化量
	const DELTA = {
		SMALL: 25, // 小さな移動量
		MEDIUM: 50, // 標準的な移動量
		LARGE: 100, // 大きな移動量
	} as const;

	// 基本的なジェスチャー状態とビュー状態
	const baseGesture: DoubleTouchGesture = {
		type: "doubleTouch",
		touches: [
			{ identifier: 1, x: BASE.X1, y: BASE.Y },
			{ identifier: 2, x: BASE.X2, y: BASE.Y },
		],
		center: { x: BASE.CENTER_X, y: BASE.Y },
		initialView: { scale: 1, angle: 0, offsetX: 0, offsetY: 0 },
	};

	const baseView = { scale: 1, angle: 0, offsetX: 0, offsetY: 0 };

	describe("ドラッグ操作", () => {
		it("右方向へのドラッグ", () => {
			const newTouches = [
				{ x: BASE.X1 + DELTA.MEDIUM, y: BASE.Y }, // 50px右へ
				{ x: BASE.X2 + DELTA.MEDIUM, y: BASE.Y }, // 50px右へ
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			expect(result.view.offsetX).toBe(DELTA.MEDIUM);
			expect(result.view.offsetY).toBe(0);
			expect(result.view.scale).toBe(1);
			expect(result.view.angle).toBe(0);
		});

		it("斜め方向へのドラッグ", () => {
			const newTouches = [
				{ x: BASE.X1 + DELTA.MEDIUM, y: BASE.Y + DELTA.MEDIUM },
				{ x: BASE.X2 + DELTA.MEDIUM, y: BASE.Y + DELTA.MEDIUM },
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			expect(result.view.offsetX).toBe(DELTA.MEDIUM);
			expect(result.view.offsetY).toBe(DELTA.MEDIUM);
			expect(result.view.scale).toBe(1);
			expect(result.view.angle).toBe(0);
		});
	});

	describe("ピンチ操作（拡大・縮小）", () => {
		it("ピンチアウト（拡大）", () => {
			const newTouches = [
				{ x: BASE.X1 - DELTA.MEDIUM, y: BASE.Y }, // 左に50px
				{ x: BASE.X2 + DELTA.MEDIUM, y: BASE.Y }, // 右に50px
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			// スケールはx, y両方向に2倍になる
			expect(result.view.scale).toBe(2); // 2倍に拡大
			expect(result.view.angle).toBe(0); // 角度は変化なし

			// 中心点の視覚的な位置を維持するために、x, y両方のオフセットが調整される
			expect(result.view.offsetX).toBe(-150); // x方向のオフセット
			expect(result.view.offsetY).toBe(-100); // y方向のオフセット（y=100の点を2倍スケールで同じ位置に保つため）

			// 中心点の座標が正しく維持されていることを確認
			expect(result.center.x).toBe(BASE.CENTER_X);
			expect(result.center.y).toBe(BASE.Y);
		});

		it("ピンチイン（縮小）", () => {
			const newTouches = [
				{ x: BASE.CENTER_X - DELTA.SMALL, y: BASE.Y }, // 中心方向に25px
				{ x: BASE.CENTER_X + DELTA.SMALL, y: BASE.Y }, // 中心方向に25px
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			// スケールはx, y両方向に0.5倍になる
			expect(result.view.scale).toBe(0.5); // 0.5倍に縮小（距離が100pxから50pxに）
			expect(result.view.angle).toBe(0); // 角度は変化なし

			// 中心点の視覚的な位置を維持するために、x, y両方のオフセットが調整される
			expect(result.view.offsetX).toBe(75); // x方向のオフセット
			expect(result.view.offsetY).toBe(50); // y方向のオフセット（y=100の点を0.5倍スケールで同じ位置に保つため）

			// 中心点の座標が正しく維持されていることを確認
			expect(result.center.x).toBe(BASE.CENTER_X);
			expect(result.center.y).toBe(BASE.Y);
		});
	});

	describe("回転操作", () => {
		it("時計回り90度", () => {
			const newTouches = [
				{ x: BASE.CENTER_X, y: BASE.Y - DELTA.MEDIUM }, // 上に50px
				{ x: BASE.CENTER_X, y: BASE.Y + DELTA.MEDIUM }, // 下に50px
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			// 回転角度とスケールを確認
			expect(result.view.angle).toBeCloseTo(90);
			expect(result.view.scale).toBeCloseTo(1);

			// 中心点の視覚的な位置を維持するために、オフセットが調整される
			expect(result.view.offsetX).toBe(BASE.CENTER_X);
			expect(result.view.offsetY).toBe(BASE.Y);

			// 中心点の座標が正しく維持されていることを確認
			expect(result.center.x).toBe(BASE.CENTER_X);
			expect(result.center.y).toBe(BASE.Y);
		});

		it("反時計回り45度", () => {
			const newTouches = [
				{ x: BASE.X1, y: BASE.Y - DELTA.LARGE }, // タッチ1を真上に100px移動
				{ x: BASE.X2, y: BASE.Y }, // タッチ2は固定
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			// 回転角度とスケールを確認
			expect(result.view.angle).toBeCloseTo(45);
			expect(result.view.scale).toBeCloseTo(1.414); // √2倍（対角線の長さ）

			// 中心点の視覚的な位置を維持するために、オフセットが調整される
			expect(result.view.offsetX).toBe(BASE.CENTER_X);
			expect(result.view.offsetY).toBe(BASE.Y);

			// 中心点の座標が正しく維持されていることを確認
			expect(result.center.x).toBe(BASE.CENTER_X);
			expect(result.center.y).toBe(BASE.Y);
		});
	});

	describe("複合操作", () => {
		it("ドラッグ + 拡大", () => {
			const newTouches = [
				{ x: BASE.X1, y: BASE.Y + DELTA.MEDIUM },
				{ x: BASE.X2 + DELTA.LARGE, y: BASE.Y + DELTA.MEDIUM },
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			expect(result.view.offsetX).toBe(DELTA.MEDIUM);
			expect(result.view.offsetY).toBe(DELTA.MEDIUM);
			expect(result.view.scale).toBe(2);
			expect(result.view.angle).toBe(0);
		});

		it("ドラッグ + 回転", () => {
			const newTouches = [
				{ x: BASE.X2, y: BASE.Y + DELTA.MEDIUM },
				{ x: BASE.X2, y: BASE.Y + DELTA.LARGE },
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			expect(result.view.offsetX).toBe(DELTA.LARGE);
			expect(result.view.offsetY).toBe(DELTA.MEDIUM);
			expect(result.view.angle).toBe(90);
			expect(result.view.scale).toBeCloseTo(1);
		});

		it("拡大 + 回転", () => {
			const newTouches = [
				{ x: BASE.X1, y: BASE.Y - DELTA.MEDIUM },
				{ x: BASE.X2 + DELTA.LARGE, y: BASE.Y + DELTA.MEDIUM },
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			expect(result.view.scale).toBeCloseTo(1.5);
			expect(result.view.angle).toBeCloseTo(45);
		});
	});

	describe("エッジケース", () => {
		it("同じ点での2タッチ（ピンチ距離が0）", () => {
			const newTouches = [
				{ x: BASE.X1, y: BASE.Y },
				{ x: BASE.X1, y: BASE.Y },
			] as const;

			const result = applyPinchGestureToView(baseGesture, newTouches, baseView);

			// 前回の状態が維持されるべき
			expect(result.view).toEqual(baseView);
		});

		it("既に回転している状態からの操作", () => {
			const rotatedView = { ...baseView, angle: 45 };
			const newTouches = [
				{ x: BASE.CENTER_X - DELTA.MEDIUM, y: BASE.Y - DELTA.MEDIUM },
				{ x: BASE.X2, y: BASE.Y },
			] as const;

			const result = applyPinchGestureToView(
				baseGesture,
				newTouches,
				rotatedView,
			);

			// 45度回転した状態での移動なので、X軸とY軸の両方に影響
			expect(result.view.offsetX).toBeCloseTo(DELTA.MEDIUM * 0.707); // 50 * cos(45)
			expect(result.view.offsetY).toBeCloseTo(-DELTA.MEDIUM * 0.707); // -50 * sin(45)
		});

		it("既に拡大している状態からの操作", () => {
			const scaledView = { ...baseView, scale: 2 };
			const newTouches = [
				{ x: BASE.X1 - DELTA.MEDIUM, y: BASE.Y },
				{ x: BASE.X2 + DELTA.LARGE, y: BASE.Y },
			] as const;

			const result = applyPinchGestureToView(
				baseGesture,
				newTouches,
				scaledView,
			);

			// 既存のスケールに対して相対的に変化
			expect(result.view.scale).toBe(3); // 2 * 1.5
		});
	});
});
