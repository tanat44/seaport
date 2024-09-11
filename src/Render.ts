import {
  Box2,
  BufferGeometry,
  DoubleSide,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector2,
  Vector3,
} from "three";

export class Render {
  static createPlane(box: Box2, material: Material, z: number) {
    const size = new Vector2();
    box.getSize(size);
    const center = new Vector2();
    box.getCenter(center);
    const geometry = new PlaneGeometry(size.x, size.y);
    const plane = new Mesh(geometry, material);
    plane.position.set(center.x, center.y, z);
    return plane;
  }

  static createPlaneMaterial(color: number) {
    return new MeshBasicMaterial({
      color,
      side: DoubleSide,
    });
  }

  static createPath(path: Vector3[], color: number): Line {
    const material = new LineBasicMaterial({ color });
    const geometry = new BufferGeometry().setFromPoints(path);
    const line = new Line(geometry, material);
    return line;
  }

  static createPath2D(path: Vector2[], z: number, color: number): Line {
    const path3 = path.map((pos) => new Vector3(pos.x, pos.y, z));
    return Render.createPath(path3, color);
  }
}
