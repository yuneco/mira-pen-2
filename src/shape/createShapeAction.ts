/**
 * @file 図形作成ツールのアクション
 * 長方形と楕円の作成
 */

import { atom } from 'jotai';
import { viewToCanvas } from '../coordinates/viewAndCanvasCoord';
import { addShapeAction, findShapeByIdAction, updateShapeAction } from '../state/shapeState';
import { viewStateAtom } from '../state/viewState';
import type { Point, Rect } from '../types/coord';
import type { Shape, ShapeStyle } from '../types/shape';
import type { Tool } from '../types/tool';
import { createOvalShape, createRectShape } from './createShape';

// 図形の最小幅/高さ（確定時）
const MIN_SHAPE_SIZE = 10;

// 図形の最小幅/高さ（ドラッグ中）
const MIN_DRAG_SIZE = 1;

// プレビュー用のスタイル
const PREVIEW_STYLE: ShapeStyle = {
  strokeColor: 'rgba(0, 0, 0, 0.5)',
  strokeWidth: 1,
  fillColor: 'rgba(255, 255, 255, 0.3)',
};

// 確定用のスタイル（createShape.tsのDEFAULT_STYLEと同じ）
const FINAL_STYLE: ShapeStyle = {
  strokeColor: '#000',
  strokeWidth: 1,
  fillColor: '#fff',
};

// ドラッグ処理
type ShapeCreatingState = Readonly<{
  /** 作成中の図形の種類 */
  tool: 'create-rect' | 'create-oval';
  /** 作成中の図形のID */
  shapeId: string;
  /** ドラッグ開始時のキャンバス座標 */
  startCanvasPoint: Point;
}>;

/**
 * 図形作成中の状態を保持します。
 * このatomにはドラッグ開始時に値がセットされ、終了時にクリアされます。
 */
const shapeCreatingStateAtom = atom<ShapeCreatingState | undefined>(undefined);

/**
 * 2点から矩形を計算します。
 * 幅と高さは常に正の値になります。
 */
const calculateRect = (point1: Point, point2: Point, minSize: number = MIN_DRAG_SIZE): Rect => {
  const x = Math.min(point1.x, point2.x);
  const y = Math.min(point1.y, point2.y);
  const width = Math.max(Math.abs(point2.x - point1.x), minSize);
  const height = Math.max(Math.abs(point2.y - point1.y), minSize);
  return { x, y, width, height, angle: 0 };
};

/**
 * 図形作成のドラッグ開始時の処理。
 * 指定のviewPointから図形の作成を開始します。
 */
export const createShapeStartAction = atom(
  undefined,
  (get, set, params: { viewPoint: Point; tool: Tool }) => {
    const { viewPoint, tool } = params;

    // 図形作成ツールでない場合は何もしない
    if (tool !== 'create-rect' && tool !== 'create-oval') {
      return;
    }

    const view = get(viewStateAtom);
    const canvasPoint = viewToCanvas(viewPoint, view);

    // 初期サイズの矩形を作成（最小ドラッグサイズで作成）
    const rect: Rect = {
      x: canvasPoint.x,
      y: canvasPoint.y,
      width: MIN_DRAG_SIZE,
      height: MIN_DRAG_SIZE,
      angle: 0,
    };

    // 図形を作成してプレビュースタイルを適用
    let shape: Shape;
    if (tool === 'create-rect') {
      shape = createRectShape(rect);
    } else {
      shape = createOvalShape(rect);
    }

    // プレビュースタイルを適用
    shape = {
      ...shape,
      style: PREVIEW_STYLE,
    };

    // 図形を追加
    set(addShapeAction, shape);

    // 図形作成中の状態をセット
    set(shapeCreatingStateAtom, {
      tool,
      shapeId: shape.id,
      startCanvasPoint: canvasPoint,
    });
  }
);

/**
 * 図形作成のドラッグ中の処理。
 * 指定のviewPointに合わせて図形のサイズを更新します。
 */
export const createShapeUpdateAction = atom(undefined, (get, set, viewPoint: Point) => {
  const shapeCreatingState = get(shapeCreatingStateAtom);

  // 図形作成中の状態がない場合は終了
  if (!shapeCreatingState) {
    return;
  }

  const view = get(viewStateAtom);
  const currentCanvasPoint = viewToCanvas(viewPoint, view);
  const { tool, shapeId, startCanvasPoint } = shapeCreatingState;

  // 矩形の座標を計算（ドラッグ中は最小サイズを1に設定）
  const rect = calculateRect(startCanvasPoint, currentCanvasPoint, MIN_DRAG_SIZE);

  // 図形を更新
  let updatedShape: Shape;
  if (tool === 'create-rect') {
    updatedShape = {
      id: shapeId,
      kind: 'rect',
      rect,
      style: PREVIEW_STYLE,
    };
  } else {
    updatedShape = {
      id: shapeId,
      kind: 'oval',
      rect,
      style: PREVIEW_STYLE,
    };
  }

  set(updateShapeAction, updatedShape);
});

/**
 * 図形作成のドラッグ終了時の処理。
 * 作成した図形を確定します。
 */
export const createShapeEndAction = atom(undefined, (get, set) => {
  const shapeCreatingState = get(shapeCreatingStateAtom);

  // 図形作成中の状態がない場合は終了
  if (!shapeCreatingState) {
    return undefined;
  }

  const { tool, shapeId } = shapeCreatingState;

  // 現在の図形を取得
  const shape = set(findShapeByIdAction, shapeId);
  if (!shape) {
    // 図形が見つからない場合は終了
    set(shapeCreatingStateAtom, undefined);
    return undefined;
  }

  // 現在の矩形を取得
  const { rect } = shape;
  let { x, y, width, height, angle } = rect;

  // 最小サイズ未満の場合は補正（確定時は通常の最小サイズを適用）
  if (width < MIN_SHAPE_SIZE) {
    width = MIN_SHAPE_SIZE;
  }
  if (height < MIN_SHAPE_SIZE) {
    height = MIN_SHAPE_SIZE;
  }

  // 幅と高さが負の値になっていないか確認（念のため）
  width = Math.max(width, 0);
  height = Math.max(height, 0);

  // 図形を更新して確定スタイルを適用
  let finalShape: Shape;
  if (tool === 'create-rect') {
    finalShape = {
      id: shapeId,
      kind: 'rect',
      rect: { x, y, width, height, angle },
      style: FINAL_STYLE,
    };
  } else {
    finalShape = {
      id: shapeId,
      kind: 'oval',
      rect: { x, y, width, height, angle },
      style: FINAL_STYLE,
    };
  }

  set(updateShapeAction, finalShape);

  // 図形作成中の状態をクリア
  set(shapeCreatingStateAtom, undefined);

  // 作成した図形のIDを返す
  return shapeId;
});

/**
 * 現在作成中の図形の矩形を取得します。
 * プレビュー表示などに使用します。
 */
export const creatingShapeRectAtom = atom<Rect | null>((get) => {
  const shapeCreatingState = get(shapeCreatingStateAtom);

  if (!shapeCreatingState) {
    return null;
  }

  return null; // 不要になったので常にnullを返す
});

/**
 * 現在作成中の図形の種類を取得します。
 */
export const creatingShapeToolAtom = atom<'create-rect' | 'create-oval' | null>((get) => {
  const shapeCreatingState = get(shapeCreatingStateAtom);
  return shapeCreatingState?.tool || null;
});
