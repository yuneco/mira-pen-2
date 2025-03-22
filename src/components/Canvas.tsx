import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import { applyPinchGestureToView } from '../coordinates/gestureTransform';
import { viewToCanvas } from '../coordinates/viewAndCanvasCoord';
import { viewDprAtom, viewStateAtom } from '../state/viewState';
import type { CanvasProps, GestureState } from '../types/canvas';
import { drawGesture } from '../utils/drawGesture';
import { drawGrid } from '../utils/drawGrid';
import { DebugLogger } from './DebugLogger';
import { GestureDebugger } from './GestureDebugger';

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
  onMultiTouchStart,
}) => {
  useAtomValue(redrawTrigger);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dpr] = useAtom(viewDprAtom);
  const [view, setView] = useAtom(viewStateAtom);
  const [gesture, setGesture] = useState<GestureState>({
    type: 'idle',
    touches: [],
  });

  // キャンバスの描画更新
  const updateCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
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
        gesture.type === 'doubleTouch' ? gesture.center : undefined,
        dpr
      );
    }
  }, [dpr, view, gesture, gridSize, showGrid, showGesture, onRender]);

  // タッチ開始時の処理
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touchPoints = Array.from(e.touches).map((t) => ({
        identifier: t.identifier,
        x: t.clientX,
        y: t.clientY,
      }));

      // シングルタッチの場合はカスタムハンドラを呼び出し
      if (touchPoints.length === 1) {
        const pointView = { x: touchPoints[0].x, y: touchPoints[0].y };
        onTouchStart?.({
          pointView,
          pointCanvas: viewToCanvas(pointView, view),
          event: e,
        });
      }

      // 複数タッチ（2本目以降のタッチ）が開始された場合
      const lastTouch = touchPoints.at(-1);
      if (lastTouch && touchPoints.length >= 2 && gesture.type === 'singleTouch') {
        onMultiTouchStart?.({
          pointView: { x: lastTouch.x, y: lastTouch.y },
          pointCanvas: viewToCanvas({ x: lastTouch.x, y: lastTouch.y }, view),
          event: e,
        });
      }

      if (enableGuesture === true || enableGuesture === 'multi-touch-only') {
        setGesture(() => {
          // 2点のタッチが検出された場合
          if (touchPoints.length >= 2) {
            // 最初の2点のみを使用
            const firstTwoTouches = [touchPoints[0], touchPoints[1]] as const;
            const center = {
              x: (firstTwoTouches[0].x + firstTwoTouches[1].x) / 2,
              y: (firstTwoTouches[0].y + firstTwoTouches[1].y) / 2,
            };

            // ジェスチャー開始イベントを発火
            onGuestureStart?.({
              pointView: center,
              pointCanvas: viewToCanvas(center, view),
              event: e,
            });

            return {
              type: 'doubleTouch',
              touches: firstTwoTouches,
              center,
              initialView: view,
            };
          }
          if (touchPoints.length === 1) {
            return {
              type: 'singleTouch',
              touches: [touchPoints[0]] as const,
            };
          }
          return { type: 'idle', touches: [] as const };
        });
      } else {
        // ジェスチャーが無効の場合も適切な型で状態を更新
        if (touchPoints.length >= 2) {
          setGesture({
            type: 'singleTouch',
            touches: [touchPoints[0]] as const,
          });
        } else if (touchPoints.length === 1) {
          setGesture({
            type: 'singleTouch',
            touches: [touchPoints[0]] as const,
          });
        } else {
          setGesture({ type: 'idle', touches: [] as const });
        }
      }
    },
    [view, onTouchStart, enableGuesture, onGuestureStart, onMultiTouchStart, gesture]
  );

  // タッチ移動時の処理
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touchPoints = Array.from(e.touches).map((t) => ({
        identifier: t.identifier,
        x: t.clientX,
        y: t.clientY,
      }));

      // シングルタッチの場合はカスタムハンドラを呼び出し
      if (touchPoints.length === 1) {
        const pointView = { x: touchPoints[0].x, y: touchPoints[0].y };
        onTouchMove?.({
          pointView,
          pointCanvas: viewToCanvas(pointView, view),
          event: e,
        });
      }

      if (enableGuesture === true || enableGuesture === 'multi-touch-only') {
        setGesture((prev) => {
          // 単純なドラッグ操作（multi-touch-onlyの場合は無効）
          if (enableGuesture === true && prev.type === 'singleTouch' && touchPoints.length === 1) {
            const dx = (touchPoints[0].x - prev.touches[0].x) / 2;
            const dy = (touchPoints[0].y - prev.touches[0].y) / 2;

            // ジェスチャー開始イベントを発火
            onGuestureStart?.({
              pointView: { x: touchPoints[0].x, y: touchPoints[0].y },
              pointCanvas: viewToCanvas(
                {
                  x: touchPoints[0].x,
                  y: touchPoints[0].y,
                },
                view
              ),
              event: e,
            });

            setView((v) => ({
              ...v,
              offsetX: v.offsetX + dx,
              offsetY: v.offsetY + dy,
            }));

            return {
              type: 'singleTouch',
              touches: [touchPoints[0]] as const,
            };
          }

          // ピンチ操作（スケール、回転、ドラッグ）
          if (prev.type === 'doubleTouch' && touchPoints.length >= 2) {
            // 最初の2点のみを使用
            const firstTwoTouches = [touchPoints[0], touchPoints[1]] as const;

            const { view: newView, center } = applyPinchGestureToView(prev, firstTwoTouches, view);

            // ジェスチャー開始イベントを発火
            onGuestureStart?.({
              pointView: center,
              pointCanvas: viewToCanvas(center, view),
              event: e,
            });

            setView(newView);

            return {
              type: 'doubleTouch',
              touches: firstTwoTouches,
              center,
              initialView: prev.initialView,
            };
          }

          // タッチ数に応じて適切な状態を返す
          if (touchPoints.length >= 2) {
            const firstTwoTouches = [touchPoints[0], touchPoints[1]] as const;
            return {
              type: 'doubleTouch',
              touches: firstTwoTouches,
              center: {
                x: (firstTwoTouches[0].x + firstTwoTouches[1].x) / 2,
                y: (firstTwoTouches[0].y + firstTwoTouches[1].y) / 2,
              },
              initialView: view,
            };
          }
          if (touchPoints.length === 1) {
            return {
              type: 'singleTouch',
              touches: [touchPoints[0]] as const,
            };
          }

          return { type: 'idle', touches: [] as const };
        });
      } else {
        // ジェスチャーが無効の場合も適切な型で状態を更新
        if (touchPoints.length >= 2) {
          setGesture({
            type: 'singleTouch',
            touches: [touchPoints[0]] as const,
          });
        } else if (touchPoints.length === 1) {
          setGesture({
            type: 'singleTouch',
            touches: [touchPoints[0]] as const,
          });
        } else {
          setGesture({ type: 'idle', touches: [] as const });
        }
      }
    },
    [setView, view, onTouchMove, enableGuesture, onGuestureStart]
  );

  // タッチ終了時の処理
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      const touchPoints = Array.from(e.touches).map((t) => ({
        identifier: t.identifier,
        x: t.clientX,
        y: t.clientY,
      }));

      // シングルタッチからタッチなしになった場合はカスタムハンドラを呼び出し
      if (gesture.type === 'singleTouch' && touchPoints.length === 0) {
        const pointView = { x: gesture.touches[0].x, y: gesture.touches[0].y };
        onTouchEnd?.({
          pointView,
          pointCanvas: viewToCanvas(pointView, view),
          event: e,
        });
      }

      // タッチ数に応じて適切な状態を返す
      if (touchPoints.length >= 2) {
        const firstTwoTouches = [touchPoints[0], touchPoints[1]] as const;
        setGesture({
          type: 'doubleTouch',
          touches: firstTwoTouches,
          center: {
            x: (firstTwoTouches[0].x + firstTwoTouches[1].x) / 2,
            y: (firstTwoTouches[0].y + firstTwoTouches[1].y) / 2,
          },
          initialView: view,
        });
      } else if (touchPoints.length === 1) {
        setGesture({
          type: 'singleTouch',
          touches: [touchPoints[0]] as const,
        });
      } else {
        setGesture({ type: 'idle', touches: [] as const });
      }
    },
    [gesture, onTouchEnd, view]
  );

  // イベントリスナーの設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchEnd, handleTouchMove, handleTouchStart]);

  // キャンバスの更新
  useEffect(() => {
    updateCanvas();
    window.addEventListener('resize', updateCanvas);
    return () => window.removeEventListener('resize', updateCanvas);
  }, [updateCanvas]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100dvh',
          touchAction: 'none', // タッチイベントの既定の動作を無効化
        }}
      />
      <GestureDebugger gesture={gesture} />
      <DebugLogger />
    </>
  );
};
