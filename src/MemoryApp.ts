import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as express from "express";
import MemoryLogger from "./util/MemoryLogger";
import * as http from "http";
import TestController from "./routes/TestController";

dotenv.config();

export class Route {
  constructor(
    readonly base: string,
    readonly mapping: string,
    readonly action: (...args) => any,
    readonly options: { header?: string[]; query?: string[]; body?: string[] }
  ) {}
}

export class HttpError extends Error {
  constructor(readonly code: number, readonly message: string) {
    super(message);
  }
}

export interface Controller {
  getRoutes(): Route[];
}

export class MemoryApp {
  private static processNames: string[] = JSON.parse(process.env.PROCESS_NAMES);

  public static initialize() {
    let platform = process.platform;
    console.log(`This platform is ${platform}.`);

    let saveData = (name, data) => {
      let original = fs.existsSync(`${name}.out`)
        ? fs.readFileSync(`${name}.out`, "utf-8")
        : "";
      fs.writeFileSync(
        `${name}.out`,
        `${original}< TICK >\n${new Date().toString()}\n${data}\n\n\n`,
        "utf-8"
      );
    };

    let memoryLog = async () => {
      for (let name of MemoryApp.processNames) {
        switch (platform.toUpperCase()) {
          case "WIN32":
            let data = await MemoryLogger.logWindows(name);
            saveData(name, data);
            break;
          case "DARWIN":
            //TO-DO
            break;
          case "LINUX":
            //TO-DO
            break;
        }
      }
    };

    setInterval(memoryLog, 1000);
  }

  public static memoryEvent(event: string) {
    MemoryApp.processNames.forEach(name => {
      let original = fs.existsSync(`${name}.out`)
        ? fs.readFileSync(`${name}.out`, "utf-8")
        : "";
      fs.writeFileSync(`${name}.out`, `${original}< ${event} >`, "utf-8");
    });
  }

  private static extract(
    action: (...args) => any,
    options: { header?: string[]; query?: string[]; body?: string[] }
  ) {
    return async (req, res, next) => {
      let params = [];
      if (options.header)
        options.header.forEach(param => params.push(req.header[param]));
      if (options.query)
        options.query.forEach(param => params.push(req.query[param]));
      if (options.body)
        options.body.forEach(param => params.push(req.body[param]));

      let data = await Promise.resolve(action(...params));

      res.status(200).send(data);
    };
  }

  constructor(
    private readonly port = process.env.PORT || "8080",
    private readonly app = express()
  ) {
    app.set("port", port);
    http.createServer(app).listen(port);

    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, "public")));

    this.addController(new TestController());
  }

  private addController(controller: Controller) {
    let addRoute = (route: Route) => {
      this.app.use(
        path.resolve(route.base, route.mapping),
        MemoryApp.extract(route.action, route.options)
      );
    };

    controller.getRoutes().forEach(route => addRoute(route));
  }
}

MemoryApp.initialize();
new MemoryApp();