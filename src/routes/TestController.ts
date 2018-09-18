import {app} from "../MemoryApp";

export default class TestController {
    constructor() {
        app.addRoute("/test",
            {
                path: "symphony/messages/",
                action: this.symphonyMessages,
                options: {body: ["count", "email", "message"]}
            });
    }

    private symphonyMessages(count: number, email: string, message: string) {

    }
}