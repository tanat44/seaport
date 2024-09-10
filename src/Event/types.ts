// Event generic

export interface EventBase {
  type: EventType;
}

export type EventType =
  | "animate"
  | "quaycranemovestart"
  | "quaycranemoveend"
  | "quaycranegantry"
  | `physicsstatechange${string}`;

export interface AnimateEvent extends EventBase {
  deltaTime: number;
}

export interface QuayCraneMoveStartEvent extends EventBase {
  quayCraneId: number;
}

export interface QuayCraneMoveEndEvent extends EventBase {
  quayCraneId: number;
}

export interface QuayCraneGantryEvent extends EventBase {
  quayCraneId: number;
}
