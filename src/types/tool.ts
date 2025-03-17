/**
 * ツールの種類
 * - pen: ペン： ペン描画
 * - hand: ハンド： 画面のスクロール・回転・ズーム
 * - select: 選択： 図形の選択・移動・サイズ変更・回転
 * - create-rect: 長方形： 長方形を作成
 * - create-oval: 楕円： 楕円を作成
 */
export type Tool = 'pen' | 'hand' | 'select' | 'create-rect' | 'create-oval';
