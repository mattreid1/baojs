import Bao from "../lib";

import { describe, expect } from "./test-utils";

describe("index", (it) => {
  it("exports app factory ", () => {
    const app = new Bao();
    expect(app).toBeInstanceOf(Bao);
  });
});
