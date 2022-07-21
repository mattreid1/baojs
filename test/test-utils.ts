import { suite, Test } from "uvu";
import * as assert from "uvu/assert";

export const expect = (value: any) => {
  return {
    toBeInstanceOf: (type: any) => {
      assert.is(value instanceof type, true);
    },
    toBe: (expected: any) => {
      assert.is(value, expected);
    },
    toEqual: (expected: any) => {
      assert.equal(value, expected);
    },
  };
};

export const describe = (name: string, cb: (it: Test) => void) => {
  const test = suite(name);
  cb(test);
  test.run();
};
