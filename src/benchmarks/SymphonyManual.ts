import { BenchmarkContext } from "../util/BenchmarkRunner";
import MetricLoggerUtil from "../util/MetricLoggerUtil";
import RobotUtil from "../util/RobotUtil";
import PlatformUtil from "../util/PlatformUtil";
import { promisify } from "util";

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
        processName: "Google Chrome",
        executable: "Google Chrome"
      },
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

    // Login and full screen process.
    async processName => {
      await RobotUtil.basicLogin(
        process.env.SYMPHONY_USERNAME,
        process.env.SYMPHONY_PASSWORD
      );
      await PlatformUtil.fullScreenProcess(processName);
      await promisify(setTimeout)(2000);
    },

    // Log that the application start test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Application Start"]),

    // Wait some time before running the next test.
    async () => await promisify(setTimeout)(120000),

    // Log that the send 100 message test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Send 100 Messages"]),

    // Wait some time before running the next test.
    async () => await promisify(setTimeout)(120000),

    // Log that the open close 10 windows test has begum.
    async processName =>
      MetricLoggerUtil.logEvents(processName, ["Open Close 10 Windows"])
  ]
};

export default benchmark;