const DISPLAY_TIME = 1;

export class MessageBox {
  canvasElement: HTMLElement;
  messageElement?: HTMLElement;

  constructor(canvasElement: HTMLElement) {
    this.canvasElement = canvasElement;
  }

  showMessage(text: string) {
    if (this.messageElement) this.messageElement.remove();

    this.messageElement = document.createElement("div");
    this.messageElement.innerHTML = text;
    this.messageElement.style.position = "absolute";
    this.messageElement.style.right = "1rem";
    this.messageElement.style.top = "1rem";
    this.messageElement.className = "element";
    document.body.appendChild(this.messageElement);

    setTimeout(() => {
      this.onTimeout();
    }, DISPLAY_TIME * 1000);
  }

  onTimeout() {
    if (this.messageElement) this.messageElement.remove();
  }
}
