import { atom } from 'jotai';
import { cornerPoints } from '../coordinates/coordUtils';
import type { Shape } from '../types/shape';
import type { Snap } from '../types/snap';
import { allShapesAtom, selectedShapeAtom } from './shapeState';

/**
 * 現在有効なすべてのスナップ定義
 */
const allSnapsBaseAtom = atom<Snap[]>([]);

/**
 * 現在有効なすべてのスナップ
 */
export const allSnapsAtom = atom((get) => get(allSnapsBaseAtom));

const snapToKey = (snap: Snap): string => {
  switch (snap.kind) {
    case 'point':
      return `point:${snap.p.x},${snap.p.y}`;
    case 'line':
      return `line:${snap.p1.x},${snap.p1.y},${snap.p2.x},${snap.p2.y}`;
    case 'x':
      return `x:${snap.value}`;
    case 'y':
      return `y:${snap.value}`;
  }
};

const uniqueSnaps = (snaps: Snap[]): Snap[] => {
  const uniqueSnaps: Snap[] = [];
  const keys = new Set<string>();
  for (const snap of snaps) {
    const key = snapToKey(snap);
    if (keys.has(key)) {
      console.log('duplicate snap', snap);
    } else {
      uniqueSnaps.push(snap);
      keys.add(key);
    }
  }
  return uniqueSnaps;
};

type Boarder = 'top' | 'bottom' | 'left' | 'right';

const createBoarderSnaps = (shape: Shape, boarders: Boarder[]): Snap[] => {
  const corners = cornerPoints(shape.rect);
  const [leftTop, rightTop, rightBottom, leftBottom] = corners;
  const snaps: Snap[] = [];

  if (boarders.includes('top')) {
    snaps.push({
      kind: 'line',
      p1: leftTop,
      p2: rightTop,
    });
  }
  if (boarders.includes('bottom')) {
    snaps.push({
      kind: 'line',
      p1: leftBottom,
      p2: rightBottom,
    });
  }
  if (boarders.includes('left')) {
    snaps.push({
      kind: 'line',
      p1: leftTop,
      p2: leftBottom,
    });
  }
  if (boarders.includes('right')) {
    snaps.push({
      kind: 'line',
      p1: rightTop,
      p2: rightBottom,
    });
  }
  return snaps;
};

/**
 * 指定した辺のSnapを生成します。
 * @param shape 図形
 * @param boarders スナップを作成する辺のリスト
 */
const createXYSnapa = (shape: Shape, boarders: Boarder[]): Snap[] => {
  // 回転が90度単位の場合はx,y軸スナップ、それ以外はlineスナップを生成
  const corners = cornerPoints(shape.rect);
  const [leftTop, rightTop, rightBottom, leftBottom] = corners;
  const snaps: Snap[] = [];

  const rotated = shape.rect.angle % 90 !== 0;

  if (boarders.includes('top')) {
    snaps.push({
      kind: 'y',
      value: leftTop.y,
    });
  }
  if (boarders.includes('bottom')) {
    snaps.push({
      kind: 'y',
      value: rightBottom.y,
    });
  }
  if (boarders.includes('left')) {
    snaps.push({
      kind: 'x',
      value: leftTop.x,
    });
  }
  if (boarders.includes('right')) {
    snaps.push({
      kind: 'x',
      value: rightBottom.x,
    });
  }
  return snaps;
};

const createCornerSnaps = (shape: Shape): Snap[] => {
  const corners = cornerPoints(shape.rect);
  const snaps: Snap[] = [];
  for (const corner of corners) {
    snaps.push({ kind: 'point', p: corner });
  }
  return snaps;
};
/**
 * 図形移動用のSnapを生成します。
 */
export const initSnapForMoveAction = atom(undefined, (get, set) => {
  const selectedShape = get(selectedShapeAtom).at(0);
  const shapes = get(allShapesAtom);
  const nonSelectedShapes = shapes.filter((shape) => shape.id !== selectedShape?.id);

  const snaps: Snap[] = [];
  const isRotated = (shape: Shape) => shape.rect.angle % 90 !== 0;

  // 選択されている図形のSnapを生成
  // 選択図形はtop, leftのSnapのみ作成する
  if (selectedShape) {
    snaps.push(...createXYSnapa(selectedShape, ['top', 'left']));
    isRotated(selectedShape) && snaps.push(...createBoarderSnaps(selectedShape, ['top', 'left']));
  }

  // 選択されていない図形のSnapを生成
  for (const shape of nonSelectedShapes) {
    const rotated = isRotated(shape);
    const sameAngle = rotated && shape.rect.angle === selectedShape?.rect.angle;
    // 回転していない図形はXY軸スナップを生成
    !rotated && snaps.push(...createXYSnapa(shape, ['top', 'bottom', 'left', 'right']));
    // 回転していて、選択図形と角度が同じ場合は辺スナップを生成
    sameAngle && snaps.push(...createBoarderSnaps(shape, ['top', 'left', 'bottom', 'right']));
    // 角スナップは全て生成
    snaps.push(...createCornerSnaps(shape));
  }

  // 重複を排除して保存
  set(allSnapsBaseAtom, uniqueSnaps(snaps));
});

export const clearSnapAction = atom(undefined, (_get, set) => {
  set(allSnapsBaseAtom, []);
});
