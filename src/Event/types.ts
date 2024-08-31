// Event generic

export interface EventBase {
  type: EventType;
}

export type EventType = "animate" | "quaycranemovestart";

export interface EventMap {
  animate: AnimateEvent;
  quaycranemovestart: QuayCraneMoveStartEvent;
}

// EventValue

export interface AnimateEvent extends EventBase {
  deltaTime: number;
}

export interface QuayCraneMoveStartEvent extends EventBase {
  quayCraneId: string;
}
