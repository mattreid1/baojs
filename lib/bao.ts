import { Errorlike, Serve, Server } from "bun";
import Context from "./context";
import { MiddlewarePosition } from "./middleware";
import Router, { TMethods } from "./router";

export default class Bao {
  #router = new Router();

  /**
   * Default error handler
   *
   * @param error
   * @returns
   */
  errorHandler = (
    error: Errorlike
  ): Response | Promise<Response> | undefined | Promise<undefined> => {
    console.error(error);
    return new Response("An error occurred! Please check the server logs.", {
      status: 500,
    });
  };

  /**
   * Middleware to be run before the path handler
   *
   * @param fn The middleware function to be run before the path handler
   */
  before(fn: IHandler) {
    this.#router.middleware.register(fn, MiddlewarePosition.Before);
  }
  /**
   * Middleware to be run after the path handler
   *
   * @param fn The middleware function to be run after the path handler
   */
  after(fn: IHandler) {
    this.#router.middleware.register(fn, MiddlewarePosition.After);
  }

  // HTTP methods

  /**
   * Creates a route for any HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  any(path: string, handler: IHandler): void {
    this.#handleMethod("ANY", path, handler);
  }
  /**
   * Creates a route for the GET HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  get(path: string, handler: IHandler): void {
    this.#handleMethod("GET", path, handler);
  }
  /**
   * Creates a route for the POST HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  post(path: string, handler: IHandler): void {
    this.#handleMethod("POST", path, handler);
  }
  /**
   * Creates a route for the PUT HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  put(path: string, handler: IHandler): void {
    this.#handleMethod("PUT", path, handler);
  }
  /**
   * Creates a route for the DELETE HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  delete(path: string, handler: IHandler): void {
    this.#handleMethod("DELETE", path, handler);
  }
  /**
   * Creates a route for the PATCH HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  patch(path: string, handler: IHandler): void {
    this.#handleMethod("PATCH", path, handler);
  }

  // Handle the HTTP methods
  #handleMethod(method: TMethods, path: string, handler: IHandler) {
    this.#router.register(method, path, handler);
  }

  /**
   * Start the server on the specified port
   *
   * @param options The options for the server
   * @returns A Bun Server object
   */
  listen(options: IListen = {}): Server {
    return Bun.serve(this.#serve(options));
  }

  #serve(listen: IListen): Serve {
    let router = this.#router;
    let errorHandler = this.errorHandler;
    return {
      async fetch(req: Request) {
        let ctx = new Context(req);
        return await router.handle(ctx);
      },
      error(error: Error) {
        return errorHandler(error);
      },
      port: listen.port || 3000,
      development: listen.development || false,
      hostname: listen.hostname || "0.0.0.0",
    };
  }
}

interface IListen {
  port?: number;
  hostname?: string;
  development?: boolean;
}

export interface IHandler {
  (ctx: Context): Context | Promise<Context>;
}
