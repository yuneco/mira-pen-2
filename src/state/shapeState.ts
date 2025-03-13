import { atom } from 'jotai';
import { createRectShape } from '../shape/createShape';
import type { Shape } from '../types/shape';

/** 確定済みの図形一覧 */
const shapesAtom = atom<Shape[]>([
  // サンプルとして1つRectを入れておく
  createRectShape({ x: 100, y: 100, width: 80, height: 50, angle: 0 }),
]);

/** 選択中の図形のID一覧 */
const selectedIdsAtom = atom<string[]>([]);

/** 全ての図形（確定済み + 入力中） */
export const allShapesAtom = atom((get) => {
  const shapes = get(shapesAtom);
  return shapes;
});

/** 図形のIDをキーとする図形一覧。内部用 */
const shapeDictAtom = atom<Map<string, Shape>>((get) => {
  const shapes = get(shapesAtom);
  return new Map(shapes.map((shape) => [shape.id, shape]));
});

/** 図形を追加 */
export const addShapeAction = atom(undefined, (get, set, shape: Shape) => {
  // 同一IDの図形が存在する場合は上書き
  const shapeMap = get(shapeDictAtom);
  shapeMap.set(shape.id, shape);
  set(shapesAtom, Array.from(shapeMap.values()));
});

/** 図形を削除 */
export const removeShapeAction = atom(undefined, (get, set, id: string) => {
  const shapeMap = get(shapeDictAtom);
  if (!shapeMap.has(id)) return;
  shapeMap.delete(id);
  set(shapesAtom, Array.from(shapeMap.values()));
});

// 図形選択　//

/** 選択中の図形一覧 */
export const selectedShapesAtom = atom((get) => {
  const selectedIds = get(selectedIdsAtom);
  const shapes = get(shapesAtom);
  return shapes.filter((shape) => selectedIds.includes(shape.id));
});

/** 図形を選択 */
export const selectShapeAction = atom(undefined, (get, set, id: string) => {
  set(selectedIdsAtom, [id]);
});

/** 図形を選択解除 */
export const selectShapeNoneAction = atom(undefined, (get, set) => {
  set(selectedIdsAtom, []);
});
