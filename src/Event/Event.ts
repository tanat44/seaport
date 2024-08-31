import { EventBase, EventType } from "./types";

export class Event {
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.element = element;
  }

  emit<T extends EventBase>(event: T) {
    this.element.dispatchEvent(new CustomEvent(event.type, { detail: event }));
  }

  on<T extends EventBase>(
    eventType: EventType,
    callback: (event: EventBase) => void
  ) {
    this.element.addEventListener(eventType, (event) => {
      callback((event as CustomEvent).detail as T);
    });
  }
}
