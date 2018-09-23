import * as path from "path";
import * as express from "express";
import * as http from "http";
import TestController from "./controller/TestController";
import { RouteParamType } from "./model/AppDecorator";

export class HttpError extends Error {
  constructor(readonly code: number, readonly message: string) {
    super(message);
  }
}

export class App {
  private readonly port = process.env.PORT || "8080";
  private readonly app = express();

  constructor(...controllers: any[]) {
    this.app.set("port", this.port);
    http.createServer(this.app).listen(this.port);

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, "public")));

    controllers.forEach(controller => this.addController(controller));
  }

  private addController(controller: any) {
    let extract = (action: (...args) => any, params: any) => {
      return async (req, res) => {
        let inject = [];
        for (let i = 0; i < Object.keys(params).length; i++) {
          let param = params[i];

          if (param.type === RouteParamType.Body)
            inject.push(req.body[param.key]);
          if (param.type === RouteParamType.Header)
            inject.push(req.headers[param.key]);
          if (param.type === RouteParamType.Query)
            inject.push(req.query[param.key]);
        }

        let data: Promise<any> = await Promise.resolve(action(...inject));
        res.status(200).send(data);
      };
    };

    let addRoute = (route: any) => {
      this.app[route.method.toLowerCase()](
        controller._base + route.mapping,
        extract(controller[route.property], route.params)
      );
    };

    for (let route of controller._routes.values()) addRoute(route);
  }
}

export const app = new App(new TestController());
