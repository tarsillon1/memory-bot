import MetricLoggerUtil from "../util/MetricLoggerUtil";
import PlatformUtil from "../util/PlatformUtil";
import { promisify } from "util";
import { BenchmarkContext } from "../util/BenchmarkRunner";
import RobotUtil from "../util/RobotUtil";

const clickWindow = async (window: number) => {
    let x : string = "75";
    let y : number = null;
    switch (PlatformUtil.getPlatform()) {
        case "WIN32":
            y = 195;
            break;
        case "DARWIN":
            y = 215;
            break;
        case "LINUX":
            //TO-DO
            break;
        default:
            break;
    }

  await RobotUtil.click(x, (y + 23 * window).toString(), "left", false);
  await promisify(setTimeout)(2000);
};
const openWindow = async (window: number) => {
  let x : string = null;
  let y : string = null;
  switch (PlatformUtil.getPlatform()) {
      case "WIN32":
        x = "665";
        y = "110";
        break;
      case "DARWIN":
        x = "670";
        y = "130";
        break;
      case "LINUX":
        //TO-DO
          break;
        default:
          break;
  }

  await clickWindow(window);
  await RobotUtil.click(x, y, "left", false);
  await promisify(setTimeout)(5000);
};
const hideWindow = async () => {
    let x : string = null;
    let y : string = null;
    switch (PlatformUtil.getPlatform()) {
        case "WIN32":
            x = "675";
            y = "675";
            break;
        case "DARWIN":
            x = "680";
            y = "130";
            break;
        case "LINUX":
            //TO-DO
            break;
        default:
            break;
    }

  await RobotUtil.click(x, y, "left", false);
  await promisify(setTimeout)(1000);
};
const closeWindow = async (processName: string, window: number) => {
    let x : string = null;
    let y : string = null;
    switch (PlatformUtil.getPlatform()) {
        case "WIN32":
            x = "357";
            y = "52";
            break;
        case "DARWIN":
            x = "680";
            y = "130";
            break;
        case "LINUX":
            //TO-DO
            break;
        default:
            break;
    }

  await clickWindow(window);
  await promisify(setTimeout)(2000);
  await PlatformUtil.setWindowProcess(processName, 0, 0, 400, 400);
  await promisify(setTimeout)(1000);
  await RobotUtil.click(x, y, "left", false);
  await promisify(setTimeout)(2000);
};

const benchmark: BenchmarkContext = {
  benchmarks: {
    windows: [
      {
        processName: "OpenFin",
        executable: `${process.env.USERPROFILE}\\Desktop\\OpenFin Sym.lnk`
      },
      {
        processName: "Symphony",
        executable: `${process.env.USERPROFILE}\\Desktop\\Symphony Shortcut.lnk`
      }
    ],
    unix: [
      {
        processName: "Symphony",
        executable: "Symphony"
      }
    ],
    linux: []
  },
  steps: [
    // Start logging memory
    async processName => {
      MetricLoggerUtil.listenOnMemoryLogs(processName, "1s", "1h").catch(
        console.log
      );
    },

    // Login and set window size.
    async processName => {
      await RobotUtil.basicLogin(
        process.env.SYMPHONY_USERNAME,
        process.env.SYMPHONY_PASSWORD
      );

      await PlatformUtil.setWindowProcess(processName, 0, 0, 700, 700);
      await promisify(setTimeout)(10000);
    },

    // Log that the application start test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Application Start"]),

    // Open 3 windows
    async () => {
      await openWindow(0);
      await hideWindow();

      await openWindow(1);
      await hideWindow();

      await openWindow(2);
      await hideWindow();
    },

    // Wait some time before running the next test.
    async () => await promisify(setTimeout)(120000),

    // Log that the send 100 message test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Send 100 Messages"]),

    // Send 100 messages
    async () => {
      await clickWindow(0);
      await RobotUtil.sendMessages(100, "Hello world!");
      await hideWindow();
    },

    // Wait some time before running the next test.
    async () => await promisify(setTimeout)(120000),

    // Log that the open close 10 windows test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Open Close 10 Windows"]),

    //Open close 10 Windows

      //Open 2 Windows
      async() => {
          await openWindow(3);
          await hideWindow();

          await openWindow(4);
          await hideWindow();
      },

      // Close all 5 windows
    async processName => {

      await closeWindow(processName, 0);
      await closeWindow(processName, 1);
      await closeWindow(processName, 2);
      await closeWindow(processName, 3);
      await closeWindow(processName, 4);
    },

     // Open 3 windows
      async () => {
          await openWindow(0);
          await hideWindow();

          await openWindow(1);
          await hideWindow();

          await openWindow(2);
          await hideWindow();
      }
  ]
};

export default benchmark;
