import * as robotjs from "robotjs";

export default class RobotUtil {
  /**
   * Login using a username and password.
   * @param {string} username the username to use for login.
   * @param {string} password the password to use for login.
   */
  public static async basicLogin(username: string, password: string) {
    let clearField = () => {
      for (let i = 0; i < 200; i++) {
        robotjs.keyTap("backspace");
      }
    };

    clearField();
    robotjs.typeString(username);
    robotjs.keyTap("tab");

    clearField();
    robotjs.typeString(password);
    robotjs.keyTap("tab");
    robotjs.keyTap("enter");
  }

  /**
   * Type and send messages.
   * @param {number} count the number of messages to send.
   * @param {string} message the message to send.
   */
  public static async sendMessages(count: number, message: string) {
    for (let i = 0; i < count; i++) {
      robotjs.typeStringDelayed(message, 60000);
      robotjs.keyTap("enter");
    }
  }

  /**
   * Drag the mouse from one position to another.
   * @param from from position to drag from.
   * @param to to position to drag to.
   */
  public static async drag(
    from: { x: string; y: string },
    to: { x: string; y: string }
  ) {
    let fromXPos = this.convertPosition(from.x, "width");
    let fromYPos = this.convertPosition(from.y, "height");

    let toXPos = this.convertPosition(to.x, "width");
    let toYPos = this.convertPosition(to.y, "height");

    robotjs.moveMouse(fromXPos, fromYPos);
    robotjs.mouseToggle("down");
    robotjs.dragMouse(toXPos, toYPos);
    robotjs.mouseToggle("up");
  }

  /**
   * Click a location on the screen.
   * @param {string} x the x position to click.
   * @param {string} y the y position to click.
   * @param {"left" | "middle" | "right"} button the button to click.
   * @param {boolean} double if true will double click the mouse.
   */
  public static async click(
    x: string,
    y: string,
    button: "left" | "middle" | "right",
    double: boolean
  ) {
    let posX: number = this.convertPosition(x, "width");
    let posY: number = this.convertPosition(y, "height");

    robotjs.moveMouse(posX, posY);
    robotjs.mouseClick(button, double);
  }

  /**
   * Convert the string position.
   * A percent will be converted to the percent times the dimension of the screen.
   * @param {string} val the value to convert.
   * @param {"width" | "height"} dim the screen dimension to use for percent conversion.
   * @returns {number} the pixel position.
   */
  private static convertPosition(val: string, dim: "width" | "height") {
    if (val.includes("%")) {
      let screenSize: number = robotjs.getScreenSize()[dim];
      return (
        screenSize * Number.parseFloat(val.substr(0, val.length - 1)) * 0.01
      );
    }

    return Number.parseFloat(val);
  }
}
