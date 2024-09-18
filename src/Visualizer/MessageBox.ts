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
    this.messageElement.style.background = "#0004";
    this.messageElement.style.padding = "0.5rem 2rem";
    this.messageElement.innerHTML = text;
    this.messageElement.style.position = "absolute";
    this.messageElement.style.right = "1rem";
    this.messageElement.style.top = "1rem";
    this.messageElement.style.borderRadius = "0.5rem";
    this.messageElement.style.fontFamily = "Verdana, sans-serif";
    document.body.appendChild(this.messageElement);

    setTimeout(() => {
      this.onTimeout();
    }, DISPLAY_TIME * 1000);
  }

  onTimeout() {
    if (this.messageElement) this.messageElement.remove();
  }
}
