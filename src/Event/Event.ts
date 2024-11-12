import { EventBase, EventType } from "./types";

type EventCallback = (event: EventBase) => void;
export class Event {
  element: HTMLElement;
  private callbacks: Map<EventCallback, EventListener>;

  constructor(element: HTMLElement) {
    this.element = element;
    this.callbacks = new Map();
  }

  emit<T extends EventBase>(event: T) {
    this.element.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  on<T extends EventBase>(eventType: EventType, callback: EventCallback) {
    const listener: EventListener = (event) => {
      callback((event as CustomEvent).detail as T);
    };
    this.callbacks.set(callback, listener);
    this.element.addEventListener(eventType, listener);
  }

  off<T extends EventBase>(
    eventType: EventType,
    callback: (event: EventBase) => void
  ) {
    const listener = this.callbacks.get(callback);
    if (!listener) {
      throw new Error("Expected listener reference here but found none");
    }
    this.element.removeEventListener(eventType, listener);
  }
}
