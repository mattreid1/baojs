import { IHandler, IWebSocketHandlers } from "../bao";
import { TMethods } from "../router";
import { Node } from "./tree";

const httpMethods = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "CONNECT",
  "OPTIONS",
  "TRACE",
  "PATCH",
];
const NOT_FOUND: IRouterResponse = { handler: null, params: {} };

export class BaoRouter {
  trees: { [key: string]: Node };
  opts: { [key: string]: any };

  constructor(opts = {}) {
    if (!(this instanceof BaoRouter)) {
      return new BaoRouter(opts);
    }
    this.trees = {};
    this.opts = opts;
  }
  any(path: string, handler: IHandler) {
    for (const method of httpMethods) {
      this.on(method as TMethods, path, handler);
    }
  }
  ws(path: string, handlers: IWebSocketHandlers) {
    if (path[0] !== "/") {
      throw new Error("path must begin with '/' in path");
    }
    if (!this.trees["WS"]) {
      this.trees["WS"] = new Node();
    }
    this.trees["WS"].addRoute(path, handlers);
    return this;
  }
  on(method: TMethods, path: string, handler: IHandler) {
    if (path[0] !== "/") {
      throw new Error("path must begin with '/' in path");
    }
    if (!this.trees[method]) {
      this.trees[method] = new Node();
    }
    this.trees[method].addRoute(path, handler);
    return this;
  }
  find(method: string, path: string): IRouterResponse {
    const tree = this.trees[method];
    if (tree) {
      return tree.search(path);
    }
    return NOT_FOUND;
  }
}

export interface IRouterResponse {
  handler: IHandler | IWebSocketHandlers | null;
  params: { [key: string]: string };
}
