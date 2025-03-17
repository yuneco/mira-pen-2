import { atom } from 'jotai';

export type ViewCoord = Readonly<{
  /** x coordinate px */
  offsetX: number;
  /** y coordinate px */
  offsetY: number;
  /** scale. default = 1 */
  scale: number;
  /** angle degrees */
  angle: number;
}>;

export const DEFAULT_VIEW_STATE: ViewCoord = {
  offsetX: 200,
  offsetY: 0,
  scale: 1,
  angle: 10,
};

/**
 * 現在のビュー座標
 */
export const viewStateAtom = atom<ViewCoord>(DEFAULT_VIEW_STATE);

/**
 * ビュー座標を更新する
 */
export const updateViewStateAtom = atom(null, (get, set, update: Partial<ViewCoord>) => {
  set(viewStateAtom, { ...get(viewStateAtom), ...update });
});

/**
 * ビューのデバイスピクセル比。
 * 初期値はwindow.devicePixelRatio。ただし、2以上の場合は2に固定。
 */
export const viewDprAtom = atom(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio);
