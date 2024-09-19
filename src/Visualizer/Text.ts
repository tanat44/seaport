//@ts-ignore
import { Box3, Mesh, MeshBasicMaterial, Object3D, Vector3 } from "three";
//@ts-ignore
import { FontLoader } from "three/addons/loaders/FontLoader.js";
//@ts-ignore
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

export class Text {
  loader: FontLoader;
  font: any;

  constructor() {
    this.loader = new FontLoader();
  }

  load(url: string = "/helvetiker_bold.typeface.json"): Promise<void> {
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
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: 80,
      depth: 5,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 5,
    });
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
    return wrapper;
  }
}
