import Bao from "../lib";
import { describe, expect } from "./test-utils";

const app = new Bao();
app.get("/", (ctx) => {
  return ctx.sendText("Hello World!");
});
let served;

describe("bao", (it) => {
  it("start()", async () => {
    served = await app.listen({ port: 3000 });
  });

  it("serves GET /", async () => {
    const res = await fetch("http://localhost:3000/");
    expect(await res.text()).toBe("Hello World!");
  });

  it("stop()", async () => {
    await served.stop();
  });
});
