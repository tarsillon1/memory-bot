import axios, { AxiosInstance } from "axios";
import * as https from "https";
import * as fs from "fs";
import * as FormData from "form-data";

export default class SymphonyClient {
  private readonly auth: AxiosInstance;
  private readonly pod: AxiosInstance;
  private readonly agent: AxiosInstance;

  constructor() {
    const httpsAgent = new https.Agent({
      key: fs.readFileSync(process.env.SYMPHONY_BOT_CERT),
      cert: fs.readFileSync(process.env.SYMPHONY_BOT_CERT),
      passphrase: process.env.SYMPHONY_BOT_CERT_PASSWORD
    });

    this.auth = axios.create({
      baseURL: process.env.SYMPHONY_AUTH_URL,
      httpsAgent
    });

    this.pod = axios.create({
      baseURL: process.env.SYMPHONY_POD_URL,
      httpsAgent
    });

    this.agent = axios.create({
      baseURL: process.env.SYMPHONY_AGENT_URL,
      httpsAgent
    });
  }

  public async authenticate() {
    let res = await this.auth.post("/sessionauth/v1/authenticate");
    const sessionToken: string = res.data.token;

    res = await this.auth.post("/keyauth/v1/authenticate");
    const keyManagerToken: string = res.data.token;

    this.setTokens(sessionToken, keyManagerToken);
  }

  public async sendMessage(sid: string, message: string) {
    const form: FormData = new FormData();
    form.append("message", message);

    let { data } = await this.agent.post(
      `/v4/stream/${sid}/message/create`,
      form,
      {
        headers: Object.assign(
          {
            "content-type": `multipart/form-data; boundary=${form._boundary}`
          },
          this.agent.defaults.headers
        )
      }
    );

    return data;
  }

  public async createIM(uids: string[]) {
    let { data } = await this.pod.post("/v1/im/create", uids);
    return data;
  }

  public async searchUser(query: { uid?: string; email?: string }) {
    let params: string[] = [];
    if (query.email) params.push(`email=${query.email}`);
    if (query.uid) params.push(`uid=${query.uid}`);

    let { data } = await this.pod.get(`/v3/users?${params.join("&")}`);
    return data.users;
  }

  private setTokens(sessionToken: string, keyManagerToken: string) {
    this.pod.defaults.headers = {
      sessionToken,
      keyManagerToken
    };

    this.agent.defaults.headers = {
      sessionToken,
      keyManagerToken
    };
  }
}
