import http from "http";
import { AddressInfo } from "net";
import { LlmService, LlmServiceError } from "../services/llmService";

type ServerBehavior = (
  req: http.IncomingMessage,
  body: any,
) => { status: number; payload: Record<string, unknown>; delayMs?: number };

describe("LlmService", () => {
  let server: http.Server;
  let baseUrl: string;
  let behavior: ServerBehavior;

  beforeAll(async () => {
    behavior = () => ({
      status: 200,
      payload: { response: '{"postIds":[]}' },
    });

    server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk.toString();
      });
      req.on("end", () => {
        const parsedBody = raw ? JSON.parse(raw) : {};
        const result = behavior(req, parsedBody);

        setTimeout(() => {
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.payload));
        }, result.delayMs || 0);
      });
    });

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test("sends request with basic auth and returns response", async () => {
    process.env.LLM_BASE_URL = baseUrl;
    process.env.LLM_USER = "student1";
    process.env.LLM_PASS = "pass123";
    process.env.LLM_MODEL = "llama3.1:8b";

    let receivedAuthHeader = "";
    let receivedBody: any = null;

    behavior = (req, body) => {
      receivedAuthHeader = req.headers.authorization || "";
      receivedBody = body;
      return {
        status: 200,
        payload: { response: '{"postIds":["1","2"]}', done: true },
      };
    };

    const service = new LlmService();
    const response = await service.generate({
      prompt: "rank this",
      format: "json",
      options: { temperature: 0.1 },
    });

    expect(response.response).toBe('{"postIds":["1","2"]}');
    expect(receivedAuthHeader).toBe(
      `Basic ${Buffer.from("student1:pass123").toString("base64")}`,
    );
    expect(receivedBody.model).toBe("llama3.1:8b");
    expect(receivedBody.prompt).toBe("rank this");
    expect(receivedBody.format).toBe("json");
  });

  test("maps 401 to LlmServiceError", async () => {
    process.env.LLM_BASE_URL = baseUrl;
    process.env.LLM_USER = "bad";
    process.env.LLM_PASS = "bad";

    behavior = () => ({
      status: 401,
      payload: { error: "Unauthorized" },
    });

    const service = new LlmService();

    await expect(service.generate({ prompt: "hello" })).rejects.toEqual(
      expect.objectContaining({
        message: "LLM authentication failed",
        statusCode: 401,
      }),
    );
  });

  test("maps timeouts to 504", async () => {
    process.env.LLM_BASE_URL = baseUrl;
    process.env.LLM_USER = "student1";
    process.env.LLM_PASS = "pass123";
    process.env.LLM_TIMEOUT_MS = "50";

    behavior = () => ({
      status: 200,
      payload: { response: "slow" },
      delayMs: 200,
    });

    const service = new LlmService();

    await expect(service.generate({ prompt: "slow call" })).rejects.toEqual(
      expect.objectContaining({
        message: "LLM service request timed out",
        statusCode: 504,
      }),
    );
  });
});
