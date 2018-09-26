import * as robotjs from "robotjs";
import { Run, With } from "../util/BenchmarkRunner";
import {promisify} from "util";

export default class RobotSteps {
  @Run("Basic Login")
  public async basicLogin(
    @With("username") username: string,
    @With("password") password: string
  ) {
    robotjs.typeString(username);
    robotjs.keyTap("tab");
    robotjs.typeString(password);
    robotjs.keyTap("tab");
    robotjs.keyTap("enter");
  }

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

  @Run("Click")
  public async click(
    @With("x") x: string,
    @With("y") y: string,
    @With("button") button: "left" | "middle" | "right",
    @With("double") double: boolean,
    @With("radius") radius : number
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
                await promisify(setTimeout)(100);
            }
        }
    }
  }

  private convertPosition(val: string, dim: "width" | "height") {
    if (val.includes("%")) {
      let screenSize: number = robotjs.getScreenSize()[dim];
      return screenSize * Number.parseFloat(val.substr(0, val.length - 1)) * 0.01;
    }

    return Number.parseFloat(val);
  }
}
