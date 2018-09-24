import SymphonyClient from "../client/SymphonyClient";
import MemoryLogger from "../util/MemoryLogger";
import { BodyParam, Controller, Method, Post } from "../model/AppDecorator";
import { HttpError } from "../App";

@Controller("/test")
export default class TestController {
  @Post("/symphony/messages")
  public async symphonyMessages(
    @BodyParam("count") count: number,
    @BodyParam("email") email: string,
    @BodyParam("message") message: string
  ) {
    MemoryLogger.metricEvent("Symphony Messages");

    let client = new SymphonyClient();
    await client.authenticate();

    console.log("Authenticated.");

    let users = await client.searchUser({ email });
    if (users.length === 0) throw new HttpError(400, "Email is not valid.");

    console.log("Got users.");

    let uids: string[] = [];
    users.forEach(user => uids.push(user.id));
    let im = await client.createIM(uids);

    console.log("Created IM.");

    for (let i = 0; i < count; i++) {
      client.sendMessage(im.id, message).catch(console.log);
    }

    return { message: "Load test began." };
  }
}
