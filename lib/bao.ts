import type { Errorlike, Serve, Server, ServerWebSocket } from "bun";
import { Context, WebSocketContext } from "./context";
import { MiddlewarePosition } from "./middleware";
import { Router, TMethods } from "./router";

export class Bao {
  #router = new Router();

  /**
   * Default error handler
   *
   * @param error The error that is thrown
   * @returns A response to be sent upon an error being thrown
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
   * Default not found handler
   *
   * @returns The response for when a route is not found
   */
  notFoundHandler = (ctx: Context): Response | Promise<Response> => {
    return new Response("404 Not Found", {
      status: 404,
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

  /**
   * Middleware to handle CORS
   *
   * @param config The CORS configuration
   */
  cors(
    config: ICorsConfiguration = {
      allowedHeaders: [],
      methods: [],
      credentials: false,
      origins: [],
      exposedHeaders: [],
      maxAge: 5000,
    }
  ) {
    const allowedHeadersString = config.allowedHeaders.join(", ");
    const methodsString = config.methods.join(", ");
    const methodsSet = new Set<string>();
    const originsStringsSet = new Set<string>();
    const originsRegexArray: RegExp[] = [];
    const exposedHeadersString = config.exposedHeaders.join(", ");

    // Add the methods to the methods set
    for (const method of config.methods) {
      methodsSet.add(method);
    }

    // Add the origins that are of type string to the origins string set
    for (const origin of config.origins) {
      if (typeof origin === "string") {
        originsStringsSet.add(origin);
      }
    }

    // Add the origins that are of type RegExp to the origins regex array
    for (const origin of config.origins) {
      if (origin instanceof RegExp) {
        originsRegexArray.push(origin);
      }
    }

    /**
     * Finds the appropriate origin to return to the client
     *
     * @param origin The origin to test
     * @returns An origin to return to the client or null
     */
    function findOrigin(origin: string): string | null {
      // Check the specified origin strings first
      if (originsStringsSet.has(origin)) {
        return origin;
      }

      // Compare the origin against the regex's
      for (const regex of originsRegexArray) {
        if (regex.test(origin)) {
          return origin;
        }
      }

      // No suitable origin found
      return null;
    }

    // Register this middleware
    this.#router.middleware.register((ctx) => {
      // The following headers should only be sent for OPTIONS requests
      if (ctx.req.method === "OPTIONS") {
        // Set allowed headers
        if (config.allowedHeaders && config.allowedHeaders.length > 0) {
          ctx.res.headers.set(
            "Access-Control-Allow-Headers",
            allowedHeadersString
          );
        }

        // Set method header
        if (config.methods && config.methods.length > 0) {
          ctx.res.headers.set("Access-Control-Allow-Methods", methodsString);
        }

        // Set max age header
        if (config.maxAge) {
          ctx.res.headers.set(
            "Access-Control-Max-Age",
            config.maxAge.toString()
          );
        }
      }

      // The following headers should be sent for all request methods

      // Set credentials header
      if (config.credentials === true) {
        ctx.res.headers.set("Access-Control-Allow-Credentials", "true");
      }

      // Set origin header
      const origin = ctx.req.headers.get("Origin");
      if (origin) {
        const foundOrigin = findOrigin(origin);
        if (foundOrigin !== null) {
          ctx.res.headers.set("Access-Control-Allow-Origin", foundOrigin);
        }
      }

      // Set exposed headers
      if (config.exposedHeaders && config.exposedHeaders.length > 0) {
        ctx.res.headers.set(
          "Access-Control-Expose-Headers",
          exposedHeadersString
        );
      }

      // Send the response immediately for OPTIONS requests
      if (ctx.req.method === "OPTIONS") {
        return ctx.sendEmpty({ status: 204 }).forceSend();
      }

      // Return context for all other requests
      return ctx;
    }, MiddlewarePosition.Before);
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

  /**
   * Creates a route for the OPTIONS HTTP method
   *
   * @param path The path of the route
   * @param handler The handler function for the route
   */
  options(path: string, handler: IHandler): void {
    this.#handleMethod("OPTIONS", path, handler);
  }

  // Handle the HTTP methods
  #handleMethod(method: TMethods, path: string, handler: IHandler) {
    this.#router.register(method, path, handler);
  }

  /**
   * Creates a route a WebSocket connection
   *
   * @param path The path of the route
   * @param handlers The handler function for the WebSocket connection
   */
  ws(path: string, handlers: IWebSocketHandlers): void {
    this.#router.registerWebSocket(path, handlers);
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
    let notFoundHandler = this.notFoundHandler;
    return {
      websocket: {
        open: (ws: ServerWebSocket<IWebSocketData>) =>
          router.handleWebSocket(ws).open(),
        close: (ws: ServerWebSocket<IWebSocketData>) =>
          router.handleWebSocket(ws).close(),
        message: (
          ws: ServerWebSocket<IWebSocketData>,
          msg: string | Uint8Array
        ) => router.handleWebSocket(ws).message(msg),
      },
      async fetch(req: Request, server: Server) {
        let ctx = new Context(req, server);
        const res = await router.handle(ctx);
        return res.status === 404 ? notFoundHandler(ctx) : res;
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

interface ICorsConfiguration {
  credentials?: boolean;
  allowedHeaders?: string[];
  methods?: string[];
  origins?: (string | RegExp)[];
  exposedHeaders?: string[];
  maxAge?: number;
}

interface IListen {
  port?: number;
  hostname?: string;
  development?: boolean;
}

export interface IHandler {
  (ctx: Context): Context | Promise<Context>;
}

export interface IWebSocketHandlers {
  open?: (ws: ServerWebSocket<IWebSocketData>) => Promise<void> | void;
  close?: (ws: ServerWebSocket<IWebSocketData>) => Promise<void> | void;
  message?: (
    ws: ServerWebSocket<IWebSocketData>,
    msg: string | Uint8Array
  ) => Promise<void> | void;

  /**
   * Runs as middleware before the connection upgrade
   *
   * @param ctx The Context from the route handler
   * @returns The final Context object before the upgrade
   */
  upgrade?(ctx: Context): Promise<Context> | Context;
}

export interface IWebSocketData {
  [key: string]: any;
  ctx: WebSocketContext;
}
