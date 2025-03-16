import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import './App.css';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { drawBoundingBox } from './components/boundingBox/drawBoundingBox';
import { drawSnaps } from './components/snap/drawSnap';
import {
  addStrokePointAction,
  allStrokesAtom,
  beginStrokeAction,
  cancelStrokeAction,
  clearStrokesAction,
  commitStrokeAction,
} from './state/paintState';
import {
  dragShapeEndAction,
  dragShapeStartAction,
  dragShapeUpdateAction,
} from './state/selectAction';
import { allShapesAtom, selectedShapesAtom } from './state/shapeState';
import { allSnapsAtom } from './state/snapState';
import type { Tool } from './types/tool';
import { drawShapes } from './utils/drawShape';
import { drawStrokes } from './utils/drawStroke';
export const App = () => {
  const [currentTool, setCurrentTool] = useState<Tool>('hand');
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

  return (
    <>
      <div>
        <Canvas
          enableGuesture={currentTool === 'hand' ? true : 'multi-touch-only'}
          redrawTrigger={allStrokesAtom}
          onRender={(e) => {
            // 全てのストロークを描画
            e.ctx.save();
            drawStrokes(e.ctx, strokes, e.view);
            e.ctx.restore();
            // 全ての図形を描画
            e.ctx.save();
            drawShapes(e.ctx, shapes, e.view);
            e.ctx.restore();
            // バウンディングボックスを描画
            e.ctx.save();
            for (const shape of selectedShapes) {
              drawBoundingBox(e.ctx, shape, e.view);
            }
            e.ctx.restore();
            // スナップを描画
            e.ctx.save();
            drawSnaps(e.ctx, snaps, e.view);
            e.ctx.restore();
          }}
          onTouchStart={(e) => {
            if (currentTool === 'pen') {
              beginStroke();
              addStrokePoint(e.pointCanvas);
            }
            if (currentTool === 'select') {
              dragShapeStart(e.pointView);
            }
          }}
          onTouchMove={(e) => {
            if (currentTool === 'pen') {
              addStrokePoint(e.pointCanvas);
            }
            if (currentTool === 'select') {
              dragShapeUpdate(e.pointView);
            }
          }}
          onTouchEnd={(e) => {
            if (currentTool === 'pen') {
              commitStroke();
            }
            if (currentTool === 'select') {
              dragShapeEnd();
            }
          }}
          onGuestureStart={() => {
            // ストローク中にジェスチャー操作が開始されたらキャンセル
            cancelStroke();
          }}
        />
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onClickClear={clearStrokes}
        />
      </div>
    </>
  );
};
