/**
 * @file 選択ツールのアクション
 * 図形の選択・選択解除・移動・リサイズ・回転
 */

import { atom } from 'jotai';
import type { Point, Rect } from '../types/coord';
import {
  allShapesAtom,
  findShapeByIdAction,
  selectShapeAction,
  selectShapeNoneAction,
  selectedShapeAtom,
  updateShapeAction,
} from './shapeState';

import { findHandle } from '../components/boundingBox/drawBoundingBox';
import { viewToCanvas } from '../coordinates/viewAndCanvasCoord';
import type { Shape } from '../types/shape';
import { viewStateAtom } from './viewState';

/** 当たり判定の結果。図形とローカル座標を返す */
type HitTestResult = {
  /** ヒットした図形 */
  shape: Shape;
  /** ヒットした図形のローカル座標 */
  localPoint: Point;
};

/**
 * 指定された座標に図形が存在するかを確認し、存在する場合はその図形とローカル座標を返します。
 */
const hitTest = (shapes: Shape[], canvasPoint: Point): HitTestResult | undefined => {
  for (const shape of shapes.toReversed()) {
    const { x, y, width, height, angle } = shape.rect;

    // 図形の中心点を計算
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // クリック位置を図形のローカル座標系に変換
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // クリック位置から図形の中心点までの相対座標
    const dx = canvasPoint.x - centerX;
    const dy = canvasPoint.y - centerY;

    // 回転を打ち消す逆変換を適用
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    // 図形のローカル座標系での矩形判定
    if (Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2) {
      return {
        shape,
        localPoint: { x: localX, y: localY },
      };
    }
  }
  return undefined;
};

// ドラッグ処理
type ShapeDraggingState = Readonly<{
  /** 図形ID */
  shapeId: string;
  /** ドラッグ開始時の図形の矩形 */
  startShapeRect: Rect;
  /** ドラッグ開始時のビュー座標 */
  startViewPoint: Point;
  /** ドラッグ開始時のキャンバス座標 */
  startCanvasPoint: Point;
  /** ドラッグ開始時の図形内ローカル座標 */
  startLocalPoint: Point;
}>;

/**
 * ドラッグ中の図形の状態を保持します。
 * このatomにはドラッグ開始時に値がセットされ、終了時にクリアされます。
 * それ以外の場所・タイミングで値を変更してはいけません。
 */
const shapeDraggingStateAtom = atom<ShapeDraggingState | undefined>(undefined);

/**
 * ドラッグ開始時の処理。
 * 指定のviewPointに図形が存在するかを確認し、存在する場合はその図形を選択し、ドラッグを開始します。
 * 存在しない場合は選択を解除します。この場合、ドラッグは開始されません。
 */
export const dragShapeStartAction = atom(undefined, (get, set, viewPoint: Point) => {
  const view = get(viewStateAtom);
  const canvasPoint = viewToCanvas(viewPoint, view);

  // 選択図形がある場合、選択図形のバウンディングボックスに対してヒットテストを行う
  const selectedShape = get(selectedShapeAtom).at(0);
  if (selectedShape) {
    const result = findHandle(selectedShape, view, canvasPoint);
    if (result) {
      console.log('ハンドルがヒットしました', result);
      return;
    }
  }
  // 全ての図形に対してヒットテストを行う
  const shapes = get(allShapesAtom);
  const result = hitTest(shapes, canvasPoint);

  // ヒットしなかった場合は選択を解除して終了
  if (!result) {
    set(selectShapeNoneAction);
    return;
  }

  // ヒットした図形を選択
  set(selectShapeAction, result.shape.id);

  // ドラッグ中の状態をセット
  set(shapeDraggingStateAtom, {
    shapeId: result.shape.id,
    startShapeRect: result.shape.rect,
    startViewPoint: viewPoint,
    startCanvasPoint: canvasPoint,
    startLocalPoint: result.localPoint,
  });
});

/**
 * ドラッグ中の座標更新処理。
 * 指定のviewPointにカーソルを移動した場合の移動処理です。
 */
export const dragShapeUpdateAction = atom(undefined, (get, set, viewPoint: Point) => {
  const shapeDraggingState = get(shapeDraggingStateAtom);

  // ドラッグ中の図形の状態がない場合は終了
  if (!shapeDraggingState) {
    return;
  }

  // ドラッグ中の図形を取得
  const shape = set(findShapeByIdAction, shapeDraggingState.shapeId);
  if (!shape) {
    return;
  }

  // ビュー座標系における移動量の差分を求める
  const view = get(viewStateAtom);
  const startCanvasPoint = shapeDraggingState.startCanvasPoint;
  const currentCanvasPoint = viewToCanvas(viewPoint, view);
  const canvasDx = currentCanvasPoint.x - startCanvasPoint.x;
  const canvasDy = currentCanvasPoint.y - startCanvasPoint.y;

  // ドラッグ開始時のrectを基準に更新
  const updatedShape = {
    ...shape,
    rect: {
      ...shapeDraggingState.startShapeRect,
      x: shapeDraggingState.startShapeRect.x + canvasDx,
      y: shapeDraggingState.startShapeRect.y + canvasDy,
    },
  };

  set(updateShapeAction, updatedShape);
});

/**
 * ドラッグ中の図形の状態をクリアします。
 * ドラッグ終了時に呼び出してください。
 */
export const dragShapeEndAction = atom(undefined, (get, set) => {
  set(shapeDraggingStateAtom, undefined);
});
