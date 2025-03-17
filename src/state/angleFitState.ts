import { atom } from 'jotai';
import { getFittedAngle } from '../components/snap/getFittedAngle';
import type { Shape } from '../types/shape';
import { allShapesAtom, selectedShapesAtom, updateShapeAction } from './shapeState';

/**
 * フィットさせる角度のセット
 */
const anglesToFitBaseAtom = atom<Set<number> | undefined>(undefined);

/**
 * 現在フィットさせている角度
 */
const currentFittedAngleAtom = atom<number | undefined>(undefined);

/**
 * フィットさせる角度のセット
 */
export const anglesToFitAtom = atom((get) => get(anglesToFitBaseAtom));

/**
 * 回転時にフィットさせる角度のセットを初期化
 */
export const initAnglesToFitAction = atom(undefined, (get, set) => {
  const angles = new Set<number>();
  const shapes = get(allShapesAtom);

  // 全ての図形の角度を取得
  for (const shape of shapes) {
    angles.add(shape.rect.angle);
    // +90, +180, +270度の角度も追加
    angles.add((shape.rect.angle + 90) % 360);
    angles.add((shape.rect.angle + 180) % 360);
    angles.add((shape.rect.angle + 270) % 360);
  }

  // 45度刻みで0-360度の角度をすべてセット
  for (let i = 0; i < 360; i += 45) {
    angles.add(i);
  }

  set(anglesToFitBaseAtom, angles);
});

/**
 * 回転時にフィットさせる角度のセットをクリア
 */
export const clearAnglesToFitAction = atom(undefined, (_get, set) => {
  set(anglesToFitBaseAtom, undefined);
  set(currentFittedAngleAtom, undefined);
});

export const fitAngleAction = atom(undefined, (get, set, shape: Shape) => {
  const angles = get(anglesToFitAtom) ?? new Set();
  const fittedAngle = getFittedAngle(shape, angles);

  // フィットさせた角度を保存
  set(currentFittedAngleAtom, fittedAngle);

  // フィットさせた図形を更新
  const fittedShape =
    fittedAngle !== undefined ? { ...shape, rect: { ...shape.rect, angle: fittedAngle } } : shape;
  set(updateShapeAction, fittedShape);
});

export const currentFitTargetShapeIdsAtom = atom((get) => {
  const currentFittedAngle = (get(currentFittedAngleAtom) ?? 0) % 90; // 90度単位に正規化
  // 90度の倍数の場合は無視
  if (currentFittedAngle % 90 === 0) {
    return [];
  }

  // 選択していない図形を取得
  const selectedIds = get(selectedShapesAtom).map((shape) => shape.id);
  const nonSelectedShapes = get(allShapesAtom).filter((shape) => !selectedIds.includes(shape.id));
  // 角度がcurrentFittedAngleと一致する図形を返す
  return nonSelectedShapes
    .filter((shape) => shape.rect.angle % 90 === currentFittedAngle)
    .map((shape) => shape.id);
});
