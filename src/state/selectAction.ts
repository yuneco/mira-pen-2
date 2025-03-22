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

import {
  type ResizeHandle,
  findHandle,
  isResizeHandle,
} from '../components/boundingBox/drawBoundingBox';
import { snapResizeHandlePoint, snapShape } from '../components/snap/snapShape';
import { viewToCanvas } from '../coordinates/viewAndCanvasCoord';
import type { Shape } from '../types/shape';
import { clearAnglesToFitAction, fitAngleAction, initAnglesToFitAction } from './angleFitState';
import { allSnapsAtom, clearSnapAction, initSnapForMoveAction } from './snapState';
import { viewStateAtom } from './viewState';

// 図形の最小幅/高さ
const MIN_SHAPE_SIZE = 10;

/** 当たり判定の結果。図形とローカル座標を返す */
type HitTestResult = {
  /** ヒットした図形 */
  shape: Shape;
  /** ヒットした図形のローカル座標 */
  localPoint: Point;
};

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
 * 指定された座標に図形が存在するかを確認し、存在する場合はその図形とローカル座標を返します。
 */
const hitTest = (shapes: Shape[], canvasPoint: Point): HitTestResult | undefined => {
  for (const shape of shapes.toReversed()) {
    const localPoint = canvasPointToLocalPoint(shape, canvasPoint);
    // 図形のローカル座標系での矩形判定
    if (
      Math.abs(localPoint.x) <= shape.rect.width / 2 &&
      Math.abs(localPoint.y) <= shape.rect.height / 2
    ) {
      return {
        shape,
        localPoint,
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
  /** ドラッグ中のハンドル */
  draggingHandle: ResizeHandle | 'body' | 'rotate';
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
 * 現在のドラッグ操作の種類を返します。
 */
export const currentDragActionAtom = atom((get) => {
  const shapeDraggingState = get(shapeDraggingStateAtom);
  if (!shapeDraggingState) {
    return undefined;
  }
  if (shapeDraggingState.draggingHandle === 'body') {
    return 'move';
  }
  if (shapeDraggingState.draggingHandle === 'rotate') {
    return 'rotate';
  }
  if (isResizeHandle(shapeDraggingState.draggingHandle)) {
    return 'resize';
  }
  return undefined;
});

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
      // ハンドルのドラッグを開始
      set(shapeDraggingStateAtom, {
        shapeId: selectedShape.id,
        startShapeRect: selectedShape.rect,
        startViewPoint: viewPoint,
        startCanvasPoint: canvasPoint,
        startLocalPoint: canvasPointToLocalPoint(selectedShape, canvasPoint),
        draggingHandle: result,
      });
      // 回転の場合、角度のフィットを初期化
      if (result === 'rotate') {
        set(initAnglesToFitAction);
      } else {
        // 回転でない場合（移動またはリサイズの場合）は移動用のスナップを生成
        set(initSnapForMoveAction, 'all');
      }
      return;
    }
  }
  // 全ての図形に対してヒットテストを行う。その際、選択中の図形がある場合は最優先で判定を行う
  const shapes = [...get(allShapesAtom)];
  if (selectedShape) {
    shapes.push(selectedShape);
  }
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
    draggingHandle: 'body',
  });
  // 移動用のスナップを生成
  set(initSnapForMoveAction, 'all');
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
  if (shapeDraggingState.draggingHandle === 'body') {
    // 図形本体のドラッグ（移動）
    const updatedShape = {
      ...shape,
      rect: {
        ...shapeDraggingState.startShapeRect,
        x: shapeDraggingState.startShapeRect.x + canvasDx,
        y: shapeDraggingState.startShapeRect.y + canvasDy,
      },
    };

    const snappedShape = snapShape(updatedShape, get(allSnapsAtom)) ?? updatedShape;

    set(updateShapeAction, snappedShape);
  } else if (shapeDraggingState.draggingHandle === 'rotate') {
    // 回転処理
    const { startShapeRect } = shapeDraggingState;
    const { x, y, width, height, angle: startAngle } = startShapeRect;

    // 図形の中心点を計算
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // 中心点から見たドラッグ開始時のカーソル位置の角度を計算（ラジアン）
    const startAngleRad = Math.atan2(startCanvasPoint.y - centerY, startCanvasPoint.x - centerX);

    // 中心点から見た現在のカーソル位置の角度を計算（ラジアン）
    const currentAngleRad = Math.atan2(
      currentCanvasPoint.y - centerY,
      currentCanvasPoint.x - centerX
    );

    // 角度の差分を計算（ラジアン）
    const angleDiffRad = currentAngleRad - startAngleRad;

    // ラジアンから度に変換
    const angleDiffDeg = (angleDiffRad * 180) / Math.PI;

    // 新しい角度を計算（開始時の角度 + 差分）
    let newAngle = startAngle + angleDiffDeg;

    // 角度を0-360の範囲に正規化
    newAngle = ((newAngle % 360) + 360) % 360;

    // 更新された図形を設定
    const updatedShape = {
      ...shape,
      rect: {
        ...startShapeRect,
        angle: newAngle,
      },
    };

    set(fitAngleAction, updatedShape);
  } else {
    // ハンドルのドラッグ（リサイズ）
    const { startShapeRect } = shapeDraggingState;
    const { x, y, width, height, angle } = startShapeRect;

    // 図形の中心点を計算
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // 回転を考慮した差分計算
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // 回転を考慮した差分
    const rotatedDx = canvasDx * cos + canvasDy * sin;
    const rotatedDy = -canvasDx * sin + canvasDy * cos;

    // 各コーナーの元の位置（図形の座標系）を計算
    const corners = [
      { x: -width / 2, y: -height / 2 }, // top-left
      { x: width / 2, y: -height / 2 }, // top-right
      { x: -width / 2, y: height / 2 }, // bottom-left
      { x: width / 2, y: height / 2 }, // bottom-right
    ];

    // ハンドルに応じたリサイズ処理
    let newWidth = width;
    let newHeight = height;
    let newCenterX = centerX;
    let newCenterY = centerY;

    switch (shapeDraggingState.draggingHandle) {
      case 'top-left': {
        // 右下が固定点
        const fixedCorner = corners[3]; // bottom-right
        const movingCorner = corners[0]; // top-left

        // 移動後の左上コーナーの位置（図形の座標系）
        const newMovingCornerX = movingCorner.x + rotatedDx;
        const newMovingCornerY = movingCorner.y + rotatedDy;

        // スナップ処理を適用
        const adjustedMovingCorner = snapResizeHandlePoint(
          { x: newMovingCornerX, y: newMovingCornerY },
          centerX,
          centerY,
          angle,
          get(allSnapsAtom)
        );
        const adjustedNewMovingCornerX = adjustedMovingCorner.x;
        const adjustedNewMovingCornerY = adjustedMovingCorner.y;

        // 新しい幅と高さを計算（スナップ補正済みの座標を使用）
        newWidth = Math.max(MIN_SHAPE_SIZE, fixedCorner.x - adjustedNewMovingCornerX);
        newHeight = Math.max(MIN_SHAPE_SIZE, fixedCorner.y - adjustedNewMovingCornerY);

        // 最小サイズに達した場合の調整
        const adjustedMovingCornerX =
          newWidth === MIN_SHAPE_SIZE ? fixedCorner.x - MIN_SHAPE_SIZE : adjustedNewMovingCornerX;
        const adjustedMovingCornerY =
          newHeight === MIN_SHAPE_SIZE ? fixedCorner.y - MIN_SHAPE_SIZE : adjustedNewMovingCornerY;

        // 新しい中心点を計算
        newCenterX =
          centerX +
          ((adjustedMovingCornerX + fixedCorner.x) / 2 - (movingCorner.x + fixedCorner.x) / 2) *
            cos -
          ((adjustedMovingCornerY + fixedCorner.y) / 2 - (movingCorner.y + fixedCorner.y) / 2) *
            sin;
        newCenterY =
          centerY +
          ((adjustedMovingCornerX + fixedCorner.x) / 2 - (movingCorner.x + fixedCorner.x) / 2) *
            sin +
          ((adjustedMovingCornerY + fixedCorner.y) / 2 - (movingCorner.y + fixedCorner.y) / 2) *
            cos;
        break;
      }

      case 'top-right': {
        // 左下が固定点
        const fixedCorner = corners[2]; // bottom-left
        const movingCorner = corners[1]; // top-right

        // 移動後の右上コーナーの位置（図形の座標系）
        const newMovingCornerX = movingCorner.x + rotatedDx;
        const newMovingCornerY = movingCorner.y + rotatedDy;

        // スナップ処理を適用
        const adjustedMovingCorner = snapResizeHandlePoint(
          { x: newMovingCornerX, y: newMovingCornerY },
          centerX,
          centerY,
          angle,
          get(allSnapsAtom)
        );
        const adjustedNewMovingCornerX = adjustedMovingCorner.x;
        const adjustedNewMovingCornerY = adjustedMovingCorner.y;

        // 新しい幅と高さを計算（スナップ補正済みの座標を使用）
        newWidth = Math.max(MIN_SHAPE_SIZE, adjustedNewMovingCornerX - fixedCorner.x);
        newHeight = Math.max(MIN_SHAPE_SIZE, fixedCorner.y - adjustedNewMovingCornerY);

        // 最小サイズに達した場合の調整
        const adjustedMovingCornerX =
          newWidth === MIN_SHAPE_SIZE ? fixedCorner.x + MIN_SHAPE_SIZE : adjustedNewMovingCornerX;
        const adjustedMovingCornerY =
          newHeight === MIN_SHAPE_SIZE ? fixedCorner.y - MIN_SHAPE_SIZE : adjustedNewMovingCornerY;

        // 新しい中心点を計算
        newCenterX =
          centerX +
          ((fixedCorner.x + adjustedMovingCornerX) / 2 - (fixedCorner.x + movingCorner.x) / 2) *
            cos -
          ((fixedCorner.y + adjustedMovingCornerY) / 2 - (fixedCorner.y + movingCorner.y) / 2) *
            sin;
        newCenterY =
          centerY +
          ((fixedCorner.x + adjustedMovingCornerX) / 2 - (fixedCorner.x + movingCorner.x) / 2) *
            sin +
          ((fixedCorner.y + adjustedMovingCornerY) / 2 - (fixedCorner.y + movingCorner.y) / 2) *
            cos;
        break;
      }

      case 'bottom-left': {
        // 右上が固定点
        const fixedCorner = corners[1]; // top-right
        const movingCorner = corners[2]; // bottom-left

        // 移動後の左下コーナーの位置（図形の座標系）
        const newMovingCornerX = movingCorner.x + rotatedDx;
        const newMovingCornerY = movingCorner.y + rotatedDy;

        // スナップ処理を適用
        const adjustedMovingCorner = snapResizeHandlePoint(
          { x: newMovingCornerX, y: newMovingCornerY },
          centerX,
          centerY,
          angle,
          get(allSnapsAtom)
        );
        const adjustedNewMovingCornerX = adjustedMovingCorner.x;
        const adjustedNewMovingCornerY = adjustedMovingCorner.y;

        // 新しい幅と高さを計算（スナップ補正済みの座標を使用）
        newWidth = Math.max(MIN_SHAPE_SIZE, fixedCorner.x - adjustedNewMovingCornerX);
        newHeight = Math.max(MIN_SHAPE_SIZE, adjustedNewMovingCornerY - fixedCorner.y);

        // 最小サイズに達した場合の調整
        const adjustedMovingCornerX =
          newWidth === MIN_SHAPE_SIZE ? fixedCorner.x - MIN_SHAPE_SIZE : adjustedNewMovingCornerX;
        const adjustedMovingCornerY =
          newHeight === MIN_SHAPE_SIZE ? fixedCorner.y + MIN_SHAPE_SIZE : adjustedNewMovingCornerY;

        // 新しい中心点を計算
        newCenterX =
          centerX +
          ((adjustedMovingCornerX + fixedCorner.x) / 2 - (movingCorner.x + fixedCorner.x) / 2) *
            cos -
          ((adjustedMovingCornerY + fixedCorner.y) / 2 - (movingCorner.y + fixedCorner.y) / 2) *
            sin;
        newCenterY =
          centerY +
          ((adjustedMovingCornerX + fixedCorner.x) / 2 - (movingCorner.x + fixedCorner.x) / 2) *
            sin +
          ((adjustedMovingCornerY + fixedCorner.y) / 2 - (movingCorner.y + fixedCorner.y) / 2) *
            cos;
        break;
      }

      case 'bottom-right': {
        // 左上が固定点
        const fixedCorner = corners[0]; // top-left
        const movingCorner = corners[3]; // bottom-right

        // 移動後の右下コーナーの位置（図形の座標系）
        const newMovingCornerX = movingCorner.x + rotatedDx;
        const newMovingCornerY = movingCorner.y + rotatedDy;

        // スナップ処理を適用
        const adjustedMovingCorner = snapResizeHandlePoint(
          { x: newMovingCornerX, y: newMovingCornerY },
          centerX,
          centerY,
          angle,
          get(allSnapsAtom)
        );
        const adjustedNewMovingCornerX = adjustedMovingCorner.x;
        const adjustedNewMovingCornerY = adjustedMovingCorner.y;

        // 新しい幅と高さを計算（スナップ補正済みの座標を使用）
        newWidth = Math.max(MIN_SHAPE_SIZE, adjustedNewMovingCornerX - fixedCorner.x);
        newHeight = Math.max(MIN_SHAPE_SIZE, adjustedNewMovingCornerY - fixedCorner.y);

        // 最小サイズに達した場合の調整
        const adjustedMovingCornerX =
          newWidth === MIN_SHAPE_SIZE ? fixedCorner.x + MIN_SHAPE_SIZE : adjustedNewMovingCornerX;
        const adjustedMovingCornerY =
          newHeight === MIN_SHAPE_SIZE ? fixedCorner.y + MIN_SHAPE_SIZE : adjustedNewMovingCornerY;

        // 新しい中心点を計算
        newCenterX =
          centerX +
          ((fixedCorner.x + adjustedMovingCornerX) / 2 - (fixedCorner.x + movingCorner.x) / 2) *
            cos -
          ((fixedCorner.y + adjustedMovingCornerY) / 2 - (fixedCorner.y + movingCorner.y) / 2) *
            sin;
        newCenterY =
          centerY +
          ((fixedCorner.x + adjustedMovingCornerX) / 2 - (fixedCorner.x + movingCorner.x) / 2) *
            sin +
          ((fixedCorner.y + adjustedMovingCornerY) / 2 - (fixedCorner.y + movingCorner.y) / 2) *
            cos;
        break;
      }
    }

    // 新しい左上座標を計算
    const newX = newCenterX - newWidth / 2;
    const newY = newCenterY - newHeight / 2;

    // 更新された図形を設定
    const updatedShape = {
      ...shape,
      rect: {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        angle,
      },
    };

    // リサイズまたは回転時は、既にハンドル位置でスナップ処理を行っているため
    // 図形全体のスナップは不要で直接更新
    set(updateShapeAction, updatedShape);
  }
});

/**
 * ドラッグ中の図形の状態をクリアします。
 * ドラッグ終了時に呼び出してください。
 */
export const dragShapeEndAction = atom(undefined, (get, set) => {
  set(shapeDraggingStateAtom, undefined);
  // スナップをクリア
  set(clearSnapAction);
  // 角度のフィットをクリア
  set(clearAnglesToFitAction);
});
