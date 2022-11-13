import { IHandler } from "./bao";
import { Context } from "./context";

export class Middleware {
  #before: Array<IHandler> = [];
  #after: Array<IHandler> = [];

  /**
   * Register the middleware with the Middleware object
   *
   * @param fn The middleware function
   * @param pos The position the middleware should be run relative the the route handler
   * @returns The position of the middleware in its respective queue
   */
  register(fn: IHandler, pos: MiddlewarePosition): number {
    if (pos == MiddlewarePosition.Before) return this.#before.push(fn);
    return this.#after.push(fn);
  }

  /**
   * Runs all the middleware to be run before the route handler
   *
   * @param ctx The Context supplied by the router
   * @returns The Content object just before it reaches the route handler
   */
  async before(ctx: Context): Promise<Context> {
    for (const middleware of this.#before) {
      if (!ctx.isLocked()) ctx = await Promise.resolve(middleware(ctx));
    }
    return ctx;
  }

  /**
   * Runs all the middleware to be run after the route handler
   *
   * @param ctx The Context from the route handler
   * @returns The final Context object
   */
  async after(ctx: Context): Promise<Context> {
    for (const middleware of this.#after) {
      if (!ctx.isLocked()) ctx = await Promise.resolve(middleware(ctx));
    }
    return ctx;
  }
}

export enum MiddlewarePosition {
  Before,
  After,
}
