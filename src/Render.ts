import {
  Box2,
  DoubleSide,
  Material,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector2,
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
}
