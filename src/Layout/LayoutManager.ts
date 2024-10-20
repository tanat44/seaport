import { Material, Vector2, Box2, Vector3 } from "three";
import { Render } from "../Visualizer/Render";
import { Visualizer } from "../Visualizer/Visualizer";
import { Layout } from "./types";

const SVG_SCALE_MULTIPLIER = 1;

export class LayoutManager {
  visualizer: Visualizer;
  layout: Layout;

  // material
  yardBlockMaterial: Material;

  constructor(visualizer: Visualizer) {
    this.visualizer = visualizer;
    this.yardBlockMaterial = Render.createBasicMaterial(0xbbbbbb);
  }

  async load(layoutPath: string = "layout.svg") {
    const res = await fetch(layoutPath);
    const text = await res.text();

    // parse svg (1mm in svg = 1000mm actual)
    const layout: Layout = {
      quayCraneOrigins: [],
      yardSpaces: [],
      terminalSize: new Vector2(),
    };
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const elements = doc.getElementsByTagName("g")[0];
    const terminalBox = new Box2();
    for (let i = 0; i < elements.children.length; ++i) {
      const element = elements.children[i];
      const label = element.getAttribute("inkscape:label");
      if (!label) continue;

      try {
        if (label === "qc") {
          const x = LayoutManager.getAttributeNumber(element, "cx");
          const y = LayoutManager.getAttributeNumber(element, "cy");
          layout.quayCraneOrigins.push(new Vector3(x, y));
        } else if (label === "yard" || label === "port") {
          const x = LayoutManager.getAttributeNumber(element, "x");
          const y = LayoutManager.getAttributeNumber(element, "y");
          const width = LayoutManager.getAttributeNumber(element, "width");
          const height = LayoutManager.getAttributeNumber(element, "height");
          if (label === "yard")
            layout.yardSpaces.push(
              new Box2(new Vector2(x, y), new Vector2(x + width, y + height))
            );
          else {
            terminalBox.min.set(x, y);
            terminalBox.max.set(x + width, y + height);
            layout.terminalSize = new Vector2(width, height);
          }
        }
      } catch (e) {
        console.error("Unable to parse", element);
      }
    }

    // convert top-left to bottom-left origin
    const h = new Vector2();
    terminalBox.getSize(h);
    for (const qc of layout.quayCraneOrigins) {
      qc.x = qc.x - terminalBox.min.x;
      qc.y = -qc.y + terminalBox.min.y + h.y;
    }
    for (const block of layout.yardSpaces) {
      const newMin = new Vector2(
        block.min.x - terminalBox.min.x,
        -block.max.y + terminalBox.min.y + h.y
      );
      const newMax = new Vector2(
        block.max.x - terminalBox.min.x,
        -block.min.y + terminalBox.min.y + h.y
      );
      block.set(newMin, newMax);
    }
    console.log(
      `Terminal size ${layout.terminalSize.x} x ${layout.terminalSize.y}`
    );

    // store layout and draw
    this.layout = layout;
    this.draw(layout);
    return layout;
  }

  draw(layout: Layout) {
    // draw terminal ground
    this.drawBox(
      new Box2(new Vector2(), layout.terminalSize),
      Render.createBasicMaterial(0xe0e0e0),
      -0.5
    );

    // draw yard blocks
    for (const block of layout.yardSpaces) {
      this.drawBox(block, this.yardBlockMaterial);
    }
  }

  drawBox(box: Box2, material: Material, z = 0) {
    const plane = Render.createPlane(box, material, z);
    this.visualizer.scene.add(plane);
  }

  static getAttributeNumber(element: Element, attributeName: string): number {
    return parseInt(element.getAttribute(attributeName)) * SVG_SCALE_MULTIPLIER;
  }
}
