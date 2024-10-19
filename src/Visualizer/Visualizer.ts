import {
  AmbientLight,
  Clock,
  Color,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SpotLight,
  Vector3,
  WebGLRenderer,
} from "three";
// @ts-ignore
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Event } from "../Event/Event";
import { SpeedChangeEvent } from "../Event/SimulationEvent";
import { EventBase, EventType } from "../Event/types";
import { CameraMoveEvent } from "../Event/VisualizationEvent";
import { Ui } from "../Ui/Ui";
import { Text } from "./Text";

const FOV = 46.8;
const SPEED_DEFAULT = 1.0;
const SPEED_MULTIPLIER = 2.0;

// unit in meters
export class Visualizer {
  private clock: Clock;
  private event: Event;
  private orbitControl: OrbitControls;
  private raycaster: Raycaster;
  private renderer: WebGLRenderer;
  private speed: number;
  private pausing: boolean;

  camera: PerspectiveCamera;
  scene: Scene;
  text: Text;
  ui: Ui;

  constructor() {
    this.raycaster = new Raycaster();
    this.setupScene();
    this.setupLighting();
    this.setupControl();
    this.clock = new Clock();
    this.event = new Event(this.renderer.domElement);
    this.text = new Text(this);
    this.ui = new Ui(this, this.renderer.domElement);
    this.pausing = false;

    this.createObjects();
    this.animate();
    this.setSpeed(SPEED_DEFAULT);
  }

  onEvent<T extends EventBase>(
    eventType: EventType,
    callback: (value: T) => void
  ) {
    this.event.on(eventType, callback);
  }

  emit(event: EventBase) {
    this.event.emit(event);
  }

  setSpeed(speed: number) {
    this.speed = speed;
    const event = new SpeedChangeEvent();
    event.speed = speed;
    this.emit(event);
  }

  increaseSpeed() {
    this.setSpeed(this.speed * SPEED_MULTIPLIER);
  }

  decreaseSpeed() {
    this.setSpeed(this.speed / SPEED_MULTIPLIER);
  }

  private async createObjects() {
    await this.text.load();
  }

  private setupLighting() {
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

  private setupScene() {
    this.scene = new Scene();
    this.scene.background = new Color(0xf0f0f0);
    this.camera = new PerspectiveCamera(
      FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.scene.add(this.camera);

    // const gridHelper = new GridHelper(100, 10);
    // gridHelper.rotateX(Math.PI / 2);
    // this.scene.add(gridHelper);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // dom
    const element = this.renderer.domElement;
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
    document.body.appendChild(element);

    window.addEventListener("resize", () => this.onWindowResize());
  }

  private setupControl() {
    // mouse orbit control
    this.camera.up.set(0, 0, 1);
    this.orbitControl = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControl.damping = 0.2;
    this.orbitControl.addEventListener("change", () => {
      const direction = new Vector3(0, 0, -1).applyQuaternion(
        this.camera.quaternion
      );
      this.emit(new CameraMoveEvent(this.camera.position.clone(), direction));
      this.render();
    });

    // initialize camera position
    this.camera.position.set(-40, -40, 100);
    this.camera.lookAt(50, 50, 0);
    this.render();

    // keyboard control
    window.addEventListener("keydown", (e) => this.onKeyDown(e));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.code === "Equal") {
      this.increaseSpeed();
    } else if (e.code === "Minus") {
      this.decreaseSpeed();
    } else if (e.code === "Space") {
      this.togglePause();
    }
  }

  private togglePause() {
    this.pausing = !this.pausing;
    this.ui.messageBox.showMessage(this.pausing ? "Paused" : "Resume");
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
    const deltaTime = this.clock.getDelta() * this.speed;

    if (!this.pausing)
      this.event.emit({
        type: "animate",
        deltaTime,
      });
  }

  get dom(): HTMLElement {
    return this.renderer.domElement;
  }
}
