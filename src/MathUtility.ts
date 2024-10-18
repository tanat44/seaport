import { Vector2, Vector3 } from "three";

const EPSILON = 0.01;

export class MathUtility {
  static vectorAngle(v: Vector2): number {
    const angle = Math.atan2(v.y, v.x);
    return angle;
  }

  static signedAngleBetweenVector(v1: Vector2, v2: Vector2): number {
    const n1 = new Vector3(v1.x, v1.y);
    const n2 = new Vector3(v2.x, v2.y);
    let angle = Math.atan2(
      n1.clone().cross(n2).dot(new Vector3(0, 0, 1)),
      n1.dot(n2)
    );
    return angle;
  }

  static floatEqual(a: number, b: number) {
    return Math.abs(a - b) < EPSILON;
  }

  static lineIntersection(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2) {
    const div = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    const px =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) -
        (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) /
      div;
    const py =
      ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) -
        (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) /
      div;

    return new Vector2(px, py);
  }
}
