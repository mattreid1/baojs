import { suite } from "uvu";
import * as assert from "uvu/assert";
import Bao from "../lib";

const test = suite("index");

test("exports app factory ", () => {
  const app = new Bao();
  assert.instance(app, Bao);
});

test.run();
