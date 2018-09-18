import {Controller, HttpError, MemoryApp, Route} from "../MemoryApp";
import SymphonyClient from "../client/SymphonyClient";

export default class TestController implements Controller {
    private async symphonyMessages(count: number, email: string, message: string) {
        MemoryApp.memoryEvent("Symphony Messages");

        let client = new SymphonyClient();
        await client.authenticate();

        let users = await client.searchUser({ email });
        if (users.length === 0) throw new HttpError(400, "Email is not valid.");

        let uids : string[] = [];
        users.forEach(user => uids.push(user.id));
        let im = await client.createIM(uids);

        for (let i = 0; i < count; i++) {
            await client.sendMessage(im.id, message);
        }

        return { message : "Load test had ended." };
    }

    getRoutes(): Route[] {
        return [
            new Route("/test",
                "symphony/messages",
                this.symphonyMessages,
                {body: ["count", "email", "message"]}
            )
        ];
    }
}