//@ts-ignore
import {
  Box3,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
//@ts-ignore
import { FontLoader } from "three/addons/loaders/FontLoader.js";
//@ts-ignore
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { CameraMoveEvent } from "../Event/VisualizationEvent";
import { MathUtility } from "../MathUtility";
import { Visualizer } from "./Visualizer";

export class Text {
  visualizer: Visualizer;
  loader: FontLoader;
  font: any;
  textObjects: Object3D[];

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.loader = new FontLoader();
    this.textObjects = [];

    visualizer.onEvent<CameraMoveEvent>(
      "cameramove",
      this.onCameraMove.bind(this)
    );
  }

  load(url: string = "helvetiker_bold.typeface.json"): Promise<void> {
    return new Promise(
      (resolve: () => void, reject: (reason: Error) => void) => {
        this.loader.load(
          url,
          (font: any) => {
            console.log("Font: Loaded");
            this.font = font;
            resolve();
          },
          undefined,
          (err: Error) => reject(err)
        );
      }
    );
  }

  createTextMesh(text: string): Object3D {
    const material = new MeshBasicMaterial({ color: "#1f1d36" });
    const geometry = this.createTextGeometry(text);
    const mesh = new Mesh(geometry, material);
    const scale = 0.02;
    mesh.scale.set(scale, scale, scale);
    mesh.rotateX(Math.PI / 2);
    const box = new Box3().setFromObject(mesh);
    const size = new Vector3();
    box.getSize(size);
    mesh.translateX(-size.x / 2);

    const wrapper = new Object3D();
    wrapper.add(mesh);
    this.textObjects.push(wrapper);
    return wrapper;
  }

  updateText(ref: Object3D, newText: string): void {
    const target = this.textObjects.find((obj) => obj === ref);
    if (!target) console.warn("cannot find reference to text");

    // dispose old geometry
    (target.children[0] as Mesh).geometry.dispose();

    // update geometry
    (target.children[0] as Mesh).geometry = this.createTextGeometry(newText);
  }

  private createTextGeometry(text: string): TextGeometry {
    return new TextGeometry(text, {
      font: this.font,
      size: 70,
      depth: 5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 5,
    });
  }

  private onCameraMove(e: CameraMoveEvent): void {
    const cameraPos = new Vector2(e.position.x, e.position.y);

    for (const text of this.textObjects) {
      // get old world matrix
      const pos = new Vector3();
      text.matrixWorld.decompose(pos, new Quaternion(), new Vector3());

      const qParent = new Quaternion();
      text.parent.getWorldQuaternion(qParent);

      // calculate new text facing rotation
      const v = cameraPos.clone().sub(MathUtility.vector3To2(pos));
      const angle = MathUtility.vectorAngle(v) + Math.PI / 2;
      const q = new Quaternion()
        .setFromEuler(new Euler(0, 0, angle))
        .multiply(qParent.invert());
      text.quaternion.copy(q);
    }
  }
}
