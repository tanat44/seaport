import { Box2, Vector2, Vector3 } from "three";

export type Layout = {
  terminalSize: Vector2;
  quayCraneOrigins: Vector3[];
  yardSpaces: Box2[];
};
