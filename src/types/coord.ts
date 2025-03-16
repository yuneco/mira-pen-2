export type Point = Readonly<{
  x: number;
  y: number;
}>;

export type Size = Readonly<{
  width: number;
  height: number;
}>;

export type RectNoAngle = Readonly<Point & Size>;

export type Rect = Readonly<
  Point &
    Size & {
      angle: number;
    }
>;
