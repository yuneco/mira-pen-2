import type { Rect } from "./coord";

/**
 * @file
 * ドロー機能で描画する図形の型を定義します。
 */

export type ShapeStyle = Readonly<{
	strokeColor: string;
	strokeWidth: number;
	fillColor: string;
}>;

type ShapeBase = Readonly<{
	id: string;
	style: ShapeStyle;
}>;

export type RectShape = Readonly<
	ShapeBase & {
		kind: "rect";
		rect: Rect;
	}
>;

export type OvalShape = Readonly<
	ShapeBase & {
		kind: "oval";
		rect: Rect;
	}
>;

export type Shape = RectShape | OvalShape;
