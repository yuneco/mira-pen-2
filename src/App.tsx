import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useState } from 'react';
import './App.css';
import { Canvas } from './components/Canvas';
import { SnapOptionToolbar } from './components/SnapOptionToolbar';
import { Toolbar } from './components/Toolbar';
import { drawBoundingBox } from './components/boundingBox/drawBoundingBox';
import { drawSnaps } from './components/snap/drawSnap';
import {
  createShapeEndAction,
  createShapeStartAction,
  createShapeUpdateAction,
} from './shape/createShapeAction';
import { currentFitTargetShapeIdsAtom } from './state/angleFitState';
import {
  addStrokePointAction,
  allStrokesAtom,
  beginStrokeAction,
  cancelStrokeAction,
  clearStrokesAction,
  commitStrokeAction,
} from './state/paintState';
import {
  currentDragActionAtom,
  dragShapeEndAction,
  dragShapeStartAction,
  dragShapeUpdateAction,
} from './state/selectAction';
import {
  allShapesAtom,
  selectShapeAction,
  selectShapeNoneAction,
  selectedShapesAtom,
} from './state/shapeState';
import { allSnapsAtom, snapTargetShapeIdsAtom } from './state/snapState';
import { toggleSnapTargetOnMultiTouchAction } from './state/snapToggleAction';
import type { CanvasRenderEvent } from './types/canvas';
import type { Point } from './types/coord';
import type { Tool } from './types/tool';
import { drawShapes } from './utils/drawShape';
import { drawStrokes } from './utils/drawStroke';

export const App = () => {
  const [currentTool, _setCurrentTool] = useState<Tool>('hand');
  // スナップオプションの状態: true=全ての図形にスナップ, false=選択した図形のみスナップ
  const [snapToAll, setSnapToAll] = useState<boolean>(true);

  const beginStroke = useSetAtom(beginStrokeAction);
  const addStrokePoint = useSetAtom(addStrokePointAction);
  const commitStroke = useSetAtom(commitStrokeAction);
  const clearStrokes = useSetAtom(clearStrokesAction);
  const cancelStroke = useSetAtom(cancelStrokeAction);
  const strokes = useAtomValue(allStrokesAtom);
  const shapes = useAtomValue(allShapesAtom);
  const selectedShapes = useAtomValue(selectedShapesAtom);
  const snaps = useAtomValue(allSnapsAtom);
  const dragShapeStart = useSetAtom(dragShapeStartAction);
  const dragShapeUpdate = useSetAtom(dragShapeUpdateAction);
  const dragShapeEnd = useSetAtom(dragShapeEndAction);
  const createShapeStart = useSetAtom(createShapeStartAction);
  const createShapeUpdate = useSetAtom(createShapeUpdateAction);
  const createShapeEnd = useSetAtom(createShapeEndAction);
  const selectShape = useSetAtom(selectShapeAction);
  const selectShapeNone = useSetAtom(selectShapeNoneAction);
  const angleFitTargetShapeIds = useAtomValue(currentFitTargetShapeIdsAtom);
  const snapTargetShapeIds = useAtomValue(snapTargetShapeIdsAtom);
  const currentDragAction = useAtomValue(currentDragActionAtom);
  const toggleSnapTargetOnMultiTouch = useSetAtom(toggleSnapTargetOnMultiTouchAction);

  const changeTool = (tool: Tool) => {
    _setCurrentTool(tool);
    // ツールを変更したら選択を解除
    selectShapeNone();
  };

  // バウンディングボックスを描画するか？
  // 選択ツールで、かつドラッグ操作でない場合は描画する
  const shouldDrawBoundingBox = currentTool === 'select' && currentDragAction !== 'move';

  const render = useCallback(
    (e: CanvasRenderEvent) => {
      // 全てのストロークを描画
      drawStrokes(e.ctx, strokes, e.view);
      // 全ての図形を描画
      drawShapes(e.ctx, shapes, e.view, {
        snapFocusShapeIds: angleFitTargetShapeIds,
        snapTargetShapeIds: snapTargetShapeIds,
      });
      // バウンディングボックスを描画
      if (shouldDrawBoundingBox) {
        for (const shape of selectedShapes) {
          drawBoundingBox(
            e.ctx,
            shape,
            e.view,
            currentDragAction ? [currentDragAction] : ['resize', 'rotate']
          );
        }
      }
      // スナップを描画
      drawSnaps(e.ctx, snaps, e.view);
    },
    [
      strokes,
      shapes,
      selectedShapes,
      snaps,
      angleFitTargetShapeIds,
      shouldDrawBoundingBox,
      currentDragAction,
      snapTargetShapeIds,
    ]
  );

  // ドラッグ開始時に使用するスナップモード
  const handleDragShapeStart = (viewPoint: Point) => {
    // スナップオプションに基づいてスナップモードを決定
    // snapToAll ? 'all' : 'selected' を第2引数として渡す
    dragShapeStart(viewPoint, snapToAll ? 'all' : 'selected');
  };

  return (
    <>
      <div>
        <Canvas
          enableGuesture={currentTool === 'hand' ? true : 'multi-touch-only'}
          redrawTrigger={allStrokesAtom}
          onRender={(e) => {
            render(e);
          }}
          onTouchStart={(e) => {
            if (currentTool === 'pen') {
              beginStroke();
              addStrokePoint(e.pointCanvas);
            }
            if (currentTool === 'select') {
              handleDragShapeStart(e.pointView);
            }
            if (currentTool === 'create-rect' || currentTool === 'create-oval') {
              createShapeStart({ viewPoint: e.pointView, tool: currentTool });
            }
          }}
          onTouchMove={(e) => {
            if (currentTool === 'pen') {
              addStrokePoint(e.pointCanvas);
            }
            if (currentTool === 'select') {
              dragShapeUpdate(e.pointView);
            }
            if (currentTool === 'create-rect' || currentTool === 'create-oval') {
              createShapeUpdate(e.pointView);
            }
          }}
          onTouchEnd={(e) => {
            if (currentTool === 'pen') {
              commitStroke();
            }
            if (currentTool === 'select') {
              dragShapeEnd();
            }
            if (currentTool === 'create-rect' || currentTool === 'create-oval') {
              // 図形作成を確定し、選択ツールに切り替え、作成した図形を選択
              const shapeId = createShapeEnd();
              changeTool('select');
              if (shapeId) {
                selectShape(shapeId);
              }
            }
          }}
          onGuestureStart={() => {
            // ストローク中にジェスチャー操作が開始されたらキャンセル
            cancelStroke();
          }}
          onMultiTouchStart={(e) => {
            console.log('マルチタッチ開始', e.pointView);
            // マルチタッチでスナップ対象を切り替え
            toggleSnapTargetOnMultiTouch(e);
          }}
        />
        <Toolbar currentTool={currentTool} onToolChange={changeTool} onClickClear={clearStrokes} />
        {currentTool === 'select' && (
          <SnapOptionToolbar snapToAll={snapToAll} onSnapToAllChange={setSnapToAll} />
        )}
      </div>
    </>
  );
};
