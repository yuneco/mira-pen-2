import { atom } from 'jotai';
import { createRectShape } from '../shape/createShape';
import type { Shape } from '../types/shape';

const sampleRect1 = createRectShape({ x: 100, y: 100, width: 70, height: 50, angle: 20 });
const sampleRect2 = createRectShape({ x: 200, y: 200, width: 100, height: 60, angle: 0 });

/** 確定済みの図形一覧 */
const shapesAtom = atom<Shape[]>([
  // サンプルとして1つRectを入れておく
  sampleRect1,
  sampleRect2,
]);

/** 選択中の図形のID一覧 */
const selectedIdsAtom = atom<string[]>([sampleRect1.id]);

/** 全ての図形（確定済み + 入力中） */
export const allShapesAtom = atom((get) => {
  const shapes = get(shapesAtom);
  return [...shapes];
});

/** 図形のIDをキーとする図形一覧。内部用 */
const shapeDictAtom = atom<Map<string, Shape>>((get) => {
  const shapes = get(shapesAtom);
  return new Map(shapes.map((shape) => [shape.id, shape]));
});

/** IDで図形を取得 */
export const findShapeByIdAction = atom(undefined, (get, _set, id: string) => {
  return get(shapeDictAtom).get(id);
});

/** 選択中の図形を取得 */
export const selectedShapeAtom = atom((get) => {
  const selectedIds = get(selectedIdsAtom);
  const shapeMap = get(shapeDictAtom);
  return selectedIds.map((id) => shapeMap.get(id)).filter((shape) => shape !== undefined);
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

/** 図形を更新 */
export const updateShapeAction = atom(undefined, (get, set, shape: Shape) => {
  const shapes = get(shapesAtom);
  const id = shape.id;
  const index = shapes.findIndex((shape) => shape.id === id);
  if (index === -1) return;
  shapes[index] = shape;
  // 参照を更新するため新しい配列にとする
  set(shapesAtom, [...shapes]);
});
