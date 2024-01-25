import type { Server } from "bun";

export class Context {
  /**
   * The raw Request object
   */
  req: Request;
  /**
   * The Response object to be sent
   */
  res: Response | null;
  /**
   * The actual Bun web server
   */
  server: Server;
  /**
   * Anything extra supplied by the middleware
   */
  extra: { [key: string]: any } = {};
  /**
   * URL parameters
   */
  params: { [key: string]: string };
  /**
   * If the Response should be immediately send
   */
  #forceSend: boolean = false;

  /**
   * The HTTP method
   */
  readonly method: string;
  /**
   * The headers supplied in the request
   */
  readonly headers: Request["headers"];
  /**
   * The host as specified by the client
   */
  readonly host: string;
  /**
   * The requested path (e.g. "/index.html")
   */
  readonly path: string;
  /**
   * The URL object
   */
  readonly url: URL;
  /**
   * URL query search parameters
   */
  readonly query: URLSearchParams;

  constructor(req: Request, server: Server) {
    this.req = req;
    this.server = server;
    this.res = null;

    const url = new URL(req.url);
    this.method = req.method;
    this.headers = req.headers;
    this.host = url.host;
    this.path = url.pathname;
    this.url = url;
    this.query = url.searchParams;
  }

  /**
   * Force sending this Context as is without any further execution (useful for middleware)
   *
   * Ensure that the Response field `res` is set before executing
   */
  forceSend(): Context {
    this.#forceSend = true;
    return this;
  }

  /**
   * Checks if the Response should be send without sending the Context through anymore processing
   *
   * @returns If further execution of this Context should not go ahead
   */
  isLocked(): boolean {
    return this.#forceSend;
  }

  accepts(type: string) {
    const accepts = this.headers.get("accept");
    return accepts.split(",").some((t) => t.includes(type));
  }

  /**
   * Creates an empty response and adds it to Context
   *
   * @param options (optional) The Response object options
   * @returns The Context object with an empty response
   */
  sendEmpty = (options: ResponseInit = { headers: {} }) => {
    this.res = new Response(null, options);
    return this;
  };

  /**
   * Creates an empty response with redirect headers and adds it to Context
   *
   * @param url The URL to redirect to. Use 'back' to go back to Referrer
   * @param alt The URL to redirect to if no Referrer
   * @param options (optional) The Response object options
   * @returns The Context object with redirect headers
   */
  redirect = (
    url: string,
    alt?: string,
    options: ResponseInit = { headers: {} }
  ) => {
    if (url === "back") {
      url = this.req.referrer || alt || "/";
    }

    if (!options.status) {
      options.status = 302;
    }

    options.headers ??= {};
    options.headers["Location"] = encodeURI(url);

    let body;
    if (this.accepts("html")) {
      body = `Redirecting to <a href="${url}">${url}</a>.`;
    } else if (this.accepts("text")) {
      body = `Redirecting to ${url}.`;
    }

    this.res = new Response(body, options);
    return this;
  };

  /**
   * Creates a response with pretty printed JSON and adds it to Context
   *
   * @param json The JSON to be sent in the response
   * @param options (optional) The Response object options
   * @returns The Context object with pretty printed JSON
   */
  sendPrettyJson = (
    json: { [key: string]: any },
    options: ResponseInit = {}
  ) => {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    this.res = new Response(JSON.stringify(json, null, 2), options);
    return this;
  };

  /**
   * Creates a JSON response and adds it to Context
   *
   * @param json The JSON to be sent in the response
   * @param options (optional) The Response object options
   * @returns The Context object with plain JSON
   */
  sendJson = (json: { [key: string]: any }, options: ResponseInit = {}) => {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    this.res = new Response(JSON.stringify(json), options);
    return this;
  };

  /**
   * Creates a simple response with the supplied text and adds it to Context
   *
   * @param text The text to respond with
   * @param options (optional) The Response object options
   * @returns The Context object with a text response
   */
  sendText = (text: string, options: ResponseInit = { headers: {} }) => {
    this.res = new Response(text, options);
    return this;
  };

  /**
   * Adds a supplied Response to the Context object
   *
   * @param res The Response object to be added to Context
   * @returns The Context object with the supplied Response
   */
  sendRaw = (res: Response) => {
    this.res = res;
    return this;
  };
}

export class WebSocketContext {
  /**
   * The raw Request object
   */
  readonly req: Request;
  /**
   * The actual Bun web server
   */
  readonly server: Server;
  /**
   * Anything extra supplied by the middleware
   */
  extra: { [key: string]: any } = {};
  /**
   * URL parameters
   */
  readonly params: { [key: string]: string };
  /**
   * The HTTP method
   */
  readonly method: string;
  /**
   * The headers supplied in the request
   */
  readonly headers: Request["headers"];
  /**
   * The host as specified by the client
   */
  readonly host: string;
  /**
   * The requested path (e.g. "/index.html")
   */
  readonly path: string;
  /**
   * The URL object
   */
  readonly url: URL;
  /**
   * URL query search parameters
   */
  readonly query: URLSearchParams;

  constructor(ctx: Context) {
    this.req = Object.freeze(ctx.req);
    this.server = ctx.server;
    this.extra = ctx.extra;
    this.params = ctx.params;
    this.method = ctx.method;
    this.headers = ctx.headers;
    this.host = ctx.host;
    this.path = ctx.path;
    this.url = ctx.url;
    this.query = ctx.query;
  }
}
