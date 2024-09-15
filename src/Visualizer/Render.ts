import {
  Box2,
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import {
  CONTAINER_SIZE_X,
  CONTAINER_SIZE_Y,
  CONTAINER_SIZE_Z,
} from "../Terminal/const";

export class Render {
  static containerMaterial = new MeshLambertMaterial({
    color: 0x9500ff,
    opacity: 0.15,
    transparent: true,
  });

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

  static createBasicMaterial(color: number, opacity?: number) {
    return new MeshBasicMaterial({
      color,
      side: DoubleSide,
      opacity: opacity ?? 1.0,
      transparent: opacity !== undefined,
    });
  }

  static createPath(path: Vector3[], color: number): Line {
    const material = new LineBasicMaterial({ color });
    const geometry = new BufferGeometry().setFromPoints(path);
    const line = new Line(geometry, material);
    return line;
  }

  static createPath2D(path: Vector2[], z: number, color: number): Object3D {
    const path3 = path.map((pos) => new Vector3(pos.x, pos.y, z));
    const pathMesh = Render.createPath(path3, color);

    return pathMesh;
  }

  static createSphere(
    center: Vector2,
    z: number,
    radius: number,
    material: Material
  ) {
    const geometry = new SphereGeometry(radius);
    const sphere = new Mesh(geometry, material);
    sphere.position.set(center.x, center.y, z);
    return sphere;
  }

  static createContainer(position: Vector3) {
    const RENDER_SCALE = 0.9;
    const box = new BoxGeometry(
      CONTAINER_SIZE_X,
      CONTAINER_SIZE_Z,
      CONTAINER_SIZE_Y
    );
    const mesh = new Mesh(box, Render.containerMaterial);
    mesh.scale.set(RENDER_SCALE, RENDER_SCALE, RENDER_SCALE);
    mesh.position.copy(position);
    return mesh;
  }
}
