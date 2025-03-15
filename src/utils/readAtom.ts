import { type Atom, atom, useSetAtom } from 'jotai';

/**
 * アトムの値を読み取る
 * @param anAtom - 読み取るアトム
 * @returns アトムの値
 */
export const readAtom = <T>(anAtom: Atom<T>) => {
  return atom(undefined, (get) => get(anAtom));
};

/**
 * アトムの値を読み取るフック
 * @param anAtom - 読み取るアトム
 * @returns アトムの値を読み取る関数
 */
export const useReadAtom = <T>(anAtom: Atom<T>) => {
  return useSetAtom(readAtom(anAtom));
};
