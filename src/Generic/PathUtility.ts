import { CubicBezierCurve, QuadraticBezierCurve, Vector2 } from "three";

const SEGMENT_LENGTH = 0.1;

export class PathUtility {
  static createCurve(
    controlPoints: Vector2[],
    fromDir: Vector2,
    toDir: Vector2
  ): Vector2[] {
    const newControlPoints: Vector2[] = [];
    const GAP = 2;

    for (let i = 0; i < controlPoints.length; ++i) {
      if (i === 0) {
        const dir = controlPoints[1].clone().sub(controlPoints[0]).normalize();
        const p = controlPoints[1].clone().sub(dir.multiplyScalar(GAP));
        const points = this.createCurveFromPose(
          controlPoints[0],
          fromDir,
          0.6,
          p,
          dir,
          0.2
        );
        newControlPoints.push(...points);
        continue;
      } else if (i === controlPoints.length - 1) {
        const dir = controlPoints[i]
          .clone()
          .sub(controlPoints[i - 1])
          .normalize();
        const p = controlPoints[i - 1].clone().add(dir.multiplyScalar(GAP));
        const points = this.createCurveFromPose(
          p,
          dir,
          0.2,
          controlPoints[i],
          toDir,
          0.6
        );
        newControlPoints.push(...points);
        continue;
      }

      // add point before control point
      const before = controlPoints[i - 1]
        .clone()
        .sub(controlPoints[i])
        .normalize();
      const p1 = controlPoints[i].clone().add(before.multiplyScalar(GAP));

      // add point after control point
      const after = controlPoints[i + 1]
        .clone()
        .sub(controlPoints[i])
        .normalize();
      const p3 = controlPoints[i].clone().add(after.multiplyScalar(GAP));

      // create curve
      const curve = new QuadraticBezierCurve(p1, controlPoints[i], p3);
      const points = curve.getPoints(curve.getLength() / SEGMENT_LENGTH);
      newControlPoints.push(...points);
    }

    return newControlPoints;
  }

  static createCurveFromPose(
    from: Vector2,
    fromDir: Vector2,
    weightFrom: number,
    to: Vector2,
    toDir: Vector2,
    weightTo: number
  ): Vector2[] {
    const length = from.distanceTo(to);
    const a = from
      .clone()
      .add(fromDir.clone().multiplyScalar(length * weightFrom));
    const b = to.clone().sub(toDir.clone().multiplyScalar(length * weightTo));
    const curve = new CubicBezierCurve(from, a, b, to);
    return curve.getPoints(curve.getLength() / SEGMENT_LENGTH);
  }

  static resample(path: Vector2[], interval: number = 0.5): Vector2[] {
    const output: Vector2[] = [];

    let carryOver = 0;
    for (let i = 0; i < path.length - 1; ++i) {
      const p0 = path[i];
      const p1 = path[i + 1];
      const v = p1.clone().sub(p0);
      const v_norm = v.clone().normalize();
      const v_length = v.length();

      if (v_length > carryOver) {
        // add remaining points
        const remainDistance = v_length - carryOver;
        const count = Math.floor(remainDistance / interval);
        let j = 0;
        do {
          output.push(
            p0
              .clone()
              .add(v_norm.clone().multiplyScalar(carryOver + j * interval))
          );
          ++j;
        } while (j <= count);
        carryOver = interval - (v_length - carryOver - count * interval);
      } else {
        carryOver -= v_length;
      }
    }
    return output;
  }
}
