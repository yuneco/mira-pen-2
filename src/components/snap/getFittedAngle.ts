import type { Shape } from '../../types/shape';

/** 角度の許容誤差(deg) */
const ANGLE_TOLERANCE = 6;

/**
 * 図形の角度をフィットさせる
 * @param shape 図形
 * @param angles フィットさせる角度のセット
 * @returns フィットさせた角度。フィットさせる角度がない場合はundefinedを返す
 */
export const getFittedAngle = (shape: Shape, angles: Set<number>): number | undefined => {
  // 現在の角度を360度以内に正規化
  const currentAngle = ((shape.rect.angle % 360) + 360) % 360;

  // 最も近い角度とその差分を探す
  let minDiff = 360;
  let closestAngle = currentAngle;

  for (const angle of angles) {
    // 比較する角度も360度以内に正規化
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // 角度の差分を計算(最短の回転方向を考慮)
    let diff = Math.abs(normalizedAngle - currentAngle);
    if (diff > 180) {
      diff = 360 - diff;
    }

    // より近い角度が見つかった場合は更新
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = normalizedAngle;
    }
  }

  // 許容誤差内に収まる角度が見つかった場合
  if (minDiff <= ANGLE_TOLERANCE) {
    return closestAngle;
  }

  // 許容誤差内の角度が見つからなかった場合
  return undefined;
};
