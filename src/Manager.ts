// @ts-ignore
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PerspectiveCamera, Raycaster, Scene, WebGLRenderer } from "three";
import * as THREE from "three";
import { QuayCrane } from "./QuayCrane";

// unit in meters
export class Manager {
  scene: Scene;
  camera: PerspectiveCamera;
  raycaster: Raycaster;
  renderer: WebGLRenderer;
  orbitControl: OrbitControls;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.setupScene();
    this.setupLighting();
    this.setupOrbitControl();

    // create objects
    new QuayCrane(this);
    this.animate();
    this.render();
  }

  addTestObject() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }

  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xf0f0f0));
    const light = new THREE.SpotLight(0xffffff, 1.0);
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
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(-30, -30, 30);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 0, 1);
    this.scene.add(this.camera);

    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.rotateX(Math.PI / 2);
    this.scene.add(gridHelper);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
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
  }
}
