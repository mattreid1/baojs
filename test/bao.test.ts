import { suite } from "uvu";
import * as assert from "uvu/assert";
import Bao from "../lib";

const test = suite("bao");

const app = new Bao();
app.get("/", (ctx) => {
  return ctx.sendText("Hello World!");
})
let served

test("start()", async () => {
  served = await app.listen({port: 3000});
});

test("serves GET /", async () => {
  const res = await fetch("http://localhost:3000/");
  assert.equal(await res.text(), "Hello World!");
})

test("stop()", async () => {
  await served.stop();
});

test.run();
