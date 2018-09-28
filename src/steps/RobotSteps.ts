import * as robotjs from "robotjs";
import { Run, With } from "../util/BenchmarkRunner";
import { promisify } from "util";

export default class RobotSteps {
  /**
   * Login using a username and password.
   * @param {string} username the username to use for login.
   * @param {string} password the password to use for login.
   */
  @Run("Basic Login")
  public async basicLogin(
    @With("username") username: string,
    @With("password") password: string
  ) {
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
  @Run("Send Messages")
  public async sendMessages(
    @With("count") count: number,
    @With("message") message: string
  ) {
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
  @Run("Drag")
  public async drag(
    @With("from") from: { x: string; y: string },
    @With("to") to: { x: string; y: string }
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
   * @param {number} radius all items within pixel radius will be clicked.
   */
  @Run("Click")
  public async click(
    @With("x") x: string,
    @With("y") y: string,
    @With("button") button: "left" | "middle" | "right",
    @With("double") double: boolean,
    @With("radius") radius: number
  ) {
    let posX: number = this.convertPosition(x, "width");
    let posY: number = this.convertPosition(y, "height");

    robotjs.moveMouse(posX, posY);
    if (!radius) radius = 0;
    for (let xOff = -radius; xOff < radius + 1; xOff++) {
      for (let yOff = -radius; yOff < radius + 1; yOff++) {
        if (xOff === radius || yOff === radius) {
          robotjs.moveMouseSmooth(posX + xOff, posY + yOff);
          robotjs.mouseClick(button, double);
          await promisify(setTimeout)(200);
        }
      }
    }
  }

  /**
   * Convert the string position.
   * A percent will be converted to the percent times the dimension of the screen.
   * @param {string} val the value to convert.
   * @param {"width" | "height"} dim the screen dimension to use for percent conversion.
   * @returns {number} the pixel position.
   */
  private convertPosition(val: string, dim: "width" | "height") {
    if (val.includes("%")) {
      let screenSize: number = robotjs.getScreenSize()[dim];
      return (
        screenSize * Number.parseFloat(val.substr(0, val.length - 1)) * 0.01
      );
    }

    return Number.parseFloat(val);
  }
}
