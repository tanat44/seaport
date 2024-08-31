// @ts-ignore
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  AmbientLight,
  BoxGeometry,
  Clock,
  Color,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SpotLight,
  WebGLRenderer,
} from "three";
import { QuayCrane } from "./QuayCrane";
import { Event } from "./Event/Event";
import { EventBase, EventType } from "./Event/types";
import { Text } from "./Text";

// unit in meters
export class Manager {
  private clock: Clock;
  private event: Event;
  private orbitControl: OrbitControls;
  camera: PerspectiveCamera;
  raycaster: Raycaster;
  scene: Scene;
  text: Text;
  renderer: WebGLRenderer;

  constructor() {
    this.raycaster = new Raycaster();
    this.setupScene();
    this.setupLighting();
    this.setupOrbitControl();
    this.clock = new Clock();
    this.event = new Event(this.renderer.domElement);
    this.text = new Text();

    this.createObjects();
    this.animate();
  }

  async createObjects() {
    await this.text.load();
    new QuayCrane(this);
  }

  addTestObject() {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    this.scene.add(cube);
  }

  setupLighting() {
    this.scene.add(new AmbientLight(0xf0f0f0));
    const light = new SpotLight(0xffffff, 1.0);
    light.position.set(0, 15, 20);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = -0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.scene.add(light);
  }

  setupScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0xf0f0f0);
    this.camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(-30, -30, 30);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);

    const gridHelper = new GridHelper(10, 10);
    gridHelper.rotateX(Math.PI / 2);
    this.scene.add(gridHelper);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    document.body.appendChild(this.renderer.domElement);

    window.addEventListener("resize", () => this.onWindowResize(this));
  }

  setupOrbitControl() {
    this.orbitControl = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControl.damping = 0.2;
    this.orbitControl.addEventListener("change", () => this.render());
    this.render();
  }

  onWindowResize(manager: Manager) {
    manager.camera.aspect = window.innerWidth / window.innerHeight;
    manager.camera.updateProjectionMatrix();
    manager.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
    const deltaTime = this.clock.getDelta();
    this.event.emit({
      type: "animate",
      deltaTime,
    });
  }

  onEvent<T extends EventBase>(
    eventType: EventType,
    callback: (value: T) => void
  ) {
    this.event.on(eventType, callback);
  }
}
