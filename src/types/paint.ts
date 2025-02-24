/**
 * ストロークの座標
 */
export type StrokePoint = {
	x: number;
	y: number;
};

/**
 * 1つのストローク
 */
export type Stroke = {
	points: StrokePoint[];
};
