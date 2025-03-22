/**
 * @file スナップ対象図形をタップ時に切り替えるアクション
 */

import { atom } from 'jotai';
import type { CanvasTouchEvent } from '../types/canvas';
import type { Point } from '../types/coord';
import type { Shape } from '../types/shape';
import { currentDragActionAtom } from './selectAction';
import { allShapesAtom } from './shapeState';
import { toggleSnapTargetShapeIdAction } from './snapState';

/**
 * キャンバス座標を図形のローカル座標に変換します
 */
const canvasPointToLocalPoint = (shape: Shape, canvasPoint: Point): Point => {
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

  return { x: localX, y: localY };
};

/**
 * 指定された座標に図形が存在するかを確認し、存在する場合はその図形を返します。
 */
const hitTest = (shapes: Shape[], canvasPoint: Point): Shape | undefined => {
  for (const shape of shapes.toReversed()) {
    const localPoint = canvasPointToLocalPoint(shape, canvasPoint);
    // 図形のローカル座標系での矩形判定
    if (
      Math.abs(localPoint.x) <= shape.rect.width / 2 &&
      Math.abs(localPoint.y) <= shape.rect.height / 2
    ) {
      return shape;
    }
  }
  return undefined;
};

/**
 * マルチタッチ時にスナップ対象の図形を切り替えるアクション
 * ドラッグ移動やリサイズ中の場合のみ動作します
 */
export const toggleSnapTargetOnMultiTouchAction = atom(
  undefined,
  (get, set, event: CanvasTouchEvent) => {
    // 現在のドラッグ操作を取得
    const currentDragAction = get(currentDragActionAtom);

    // ドラッグ移動やリサイズの場合のみ処理を行う
    if (currentDragAction !== 'move' && currentDragAction !== 'resize') {
      return;
    }

    // タップした座標をキャンバス座標に変換
    const canvasPoint = event.pointCanvas;

    // ヒットテストを実行
    const shapes = get(allShapesAtom);
    const hitShape = hitTest(shapes, canvasPoint);

    // 図形が見つかった場合、スナップ対象の切り替えを行う
    if (hitShape) {
      set(toggleSnapTargetShapeIdAction, hitShape.id);
    }
  }
);
