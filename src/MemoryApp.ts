import * as path from "path";
import * as fs from "fs";
import * as express from "express";
import MemoryLogger from "./util/MemoryLogger";
import * as http from "http";

export class MemoryApp {
    constructor(private readonly port = process.env.PORT || '8080',
                private readonly app = express()) {
        app.set('port', port);
        http.createServer(app).listen(port);

        app.use(express.urlencoded({extended: true}));
        app.use(express.static(path.join(__dirname, 'public')));

        this.initMemoryLoop();
    }

    public addRoute(base: string, route: { path: string; action: (...args) => any; options: { header?: string[], query?: string[]; body?: string[]; } }) {
        this.app.use(path.resolve(base, route.path), this.extract(route.action, route.options));
    }

    public extract(action: (...args) => any, options: { header?: string[], query?: string[]; body?: string[]; }) {
        return async (req, res, next) => {
            let params = [];
            options.header.forEach(param => params.push(req.header[param]));
            options.query.forEach(param => params.push(req.query[param]));
            options.body.forEach(param => params.push(req.body[param]));

            let data = await Promise.resolve(action(...params));

            res.status(200).send(data);
        }
    }

    private initMemoryLoop() {
        let platform = process.platform;
        console.log(`This platform is ${platform}.`);

        let saveData = (name, data) => {
            let original = fs.existsSync(`${name}.out`) ? fs.readFileSync(`${name}.out`, "utf-8") : "";
            fs.writeFileSync(`${name}.out`,
                `${original}<-NEXT->\n${new Date().toString()}\n${data}\n\n\n`, "utf-8");
        };

        let processNames = process.env.PROCESS_NAMES ? JSON.parse(process.env.PROCESS_NAMES) : ["openfin"];
        let memoryLog = async () => {
            for (let name of processNames) {
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
}

export const app = new MemoryApp();
