import { atom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { viewToCanvas } from '../coordinates/viewAndCanvasCoord';
import type { Point } from '../types/coord';
import { useReadAtom } from '../utils/readAtom';
import { viewStateAtom } from './viewState';

type RawPointerState = Readonly<{
  phase: DragPhase;
  /** ビュー座標（タッチ座標） */
  viewPoint: Point;
  /** キャンバス座標（描画座標） */
  canvasPoint: Point;
}>;

type DragPhase = 'hover' | 'down' | 'drag' | 'up';

const pointerState = atom<RawPointerState>({
  phase: 'hover',
  canvasPoint: { x: 0, y: 0 },
  viewPoint: { x: 0, y: 0 },
});

export const pointerStateAtom = atom((get) => {
  return get(pointerState);
});

export const setPointerAction = atom(
  undefined, // read
  (get, set, update: RawPointerState) => {
    set(pointerState, update);
  }
);

export const useLinkPointerState = (el: HTMLElement) => {
  const setPointerState = useSetAtom(pointerState);
  const readView = useReadAtom(viewStateAtom);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      setPointerState({
        phase: 'down',
        viewPoint: { x: e.clientX, y: e.clientY },
        canvasPoint: viewToCanvas({ x: e.clientX, y: e.clientY }, readView()),
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      setPointerState({
        phase: e.buttons === 1 ? 'drag' : 'hover',
        viewPoint: { x: e.clientX, y: e.clientY },
        canvasPoint: viewToCanvas({ x: e.clientX, y: e.clientY }, readView()),
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      setPointerState({
        phase: 'up',
        viewPoint: { x: e.clientX, y: e.clientY },
        canvasPoint: viewToCanvas({ x: e.clientX, y: e.clientY }, readView()),
      });
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
    };
  }, [el, setPointerState, readView]);
};
