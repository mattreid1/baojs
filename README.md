# 🥟 Bao.js

[![](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![npm](https://img.shields.io/npm/v/baojs.svg)](https://www.npmjs.com/package/baojs)
[![npm](https://img.shields.io/npm/l/baojs.svg)](https://spdx.org/licenses/MIT)
[![npm](https://img.shields.io/npm/dt/baojs.svg)](<[![npm](https://img.shields.io/npm/v/npm.svg)](https://www.npmjs.com/package/baojs)>)

A fast, minimalist web framework for the [Bun JavaScript runtime](https://bun.sh/).

⚡️ **Bao.js** is **3.7x faster** than **Express.js** and has similar syntax for an easy transition.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Examples](#examples)
  - [Middleware](#middleware)
- [Benchmarks](#benchmarks)
- [Contribute](#contribute)
- [License](#license)

## Background

Bun was released as a fast, modern JavaScript runtime. One of the many improvements over Node.js was the 2.5x increase in HTTP request throughput when compared to the Node.js `http` module ([reference](https://github.com/Jarred-Sumner/bun/blob/7d1c9fa1a471d180c078a860c4885478f334bdf5/README.md#bunserve---fast-http-server)).

Bao.js uses Bun's built in `Bun.serve` module to serve routes and uses a radix tree for finding those routes resulting in exceptionally low latency response times. Bao is loosely syntactically modelled after [Express.js](https://github.com/expressjs/express) and [Koa.js](https://koajs.com/) with a handful of changes and upgrades to help with speed and improve the developer experience.

Bao works creating a `Context` object (`ctx`) for each request and passing that through middleware and the destination route. This Context object also has various shortcut methods to make life easier such as by having standard response types (e.g. `ctx.sendJson({ "hello": "world" })`). When a route or middleware is finished, it should return the Context object to pass it along the chain until it is sent to the user.

The code is well documented and uses TypeScript, but more complete documentation will be added here in the future. It is not recommended to use this in production yet as both Bun and Bao.js are in beta.

## Install

Although this package is distributed via NPM, is only compatible with Bun (not Node.js) as it uses native Bun libraries.

You must first install [Bun](https://bun.sh/) and use it to run your server.

🧑‍💻 To install Bao.js, in your project directory, run `bun add baojs`

## Usage

You can import Bao by using

```typescript
import Bao from "baojs";

const app = new Bao();
```

To create a GET route, run

```typescript
app.get("/", (ctx) => {
  return ctx.sendText("OK");
});
```

Then to get Bao to listen for requests, run

```typescript
app.listen();
```

This will start a web sever on the default port 3000 listening on all interfaces (`0.0.0.0`). The port can be modified in the `listen()` options

```typescript
app.listen({ port: 8080 });
```

### Examples

#### Hello World

Run `bun index.ts`

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

app.get("/", (ctx) => {
  return ctx.sendText("Hello World!");
});

app.listen();
```

#### Read request body

Run `bun index.ts`

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

app.post("/pretty", async (ctx) => {
  const json = await ctx.req.json();
  return ctx.sendPrettyJson(json);
});

app.listen();
```

#### Named parameters

Run `bun index.ts`

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

app.get("/user/:user", (ctx) => {
  const user = await getUser(ctx.params.user);
  return ctx.sendJson(user);
});

app.get("/user/:user/:post/data", (ctx) => {
  const post = await getPost(ctx.params.post);
  return ctx.sendJson({ post: post, byUser: user });
});

app.listen();
```

#### Wildcards

Wildcards are different to named parameters as wildcards must be at the end of paths as they will catch everything.

The following would be produced from the example below

- `GET /posts/123` => `/123`
- `GET /posts/123/abc` => `/123/abc`

Run `bun index.ts`

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

app.get("/posts/*post", (ctx) => {
  return ctx.sendText(ctx.params.post);
});

app.listen();
```

#### Custom error handler

Run `bun index.ts`

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

app.get("/", (ctx) => {
  return ctx.sendText("Hello World!");
});

// A perpetually broken POST route
app.post("/broken", (ctx) => {
  throw "An intentional error has occurred in POST /broken";
  return ctx.sendText("I will never run...");
});

// Custom error handler
app.errorHandler = (error: Error) => {
  logErrorToLoggingService(error);
  return new Response("Oh no! An error has occurred...");
};

// Custom 404 not found handler
app.notFoundHandler = () => {
  return new Response("Route not found...");
};

app.listen();
```

### Middleware

Middleware is split into middleware that runs before the routes, and middleware that runs after them. This helps to contribute to the performance of Bao.js.

```typescript
// index.ts
import Bao from "baojs";

const app = new Bao();

// Runs before the routes
app.before((ctx) => {
  const user = getUser(ctx.headers.get("Authorization"));
  if (user === null) return ctx.sendEmpty({ status: 403 }).forceSend();
  ctx.extra["auth"] = user;
  return ctx;
});

app.get("/", (ctx) => {
  return ctx.sendText(`Hello ${ctx.extra.user.displayName}!`);
});

// Runs after the routes
app.after((ctx) => {
  ctx.res.headers.append("version", "1.2.3");
  return ctx;
});

app.listen();
```

The `.forceSend()` method tells Bao to not pass the Context object to anything else but instead send it straight to the user. This is useful in cases like this where we don't want unauthenticated users to be able to access our routes and so we just reject their request before it can make it to the route handler.

### Benchmarks

Benchmarks were conducted using [`wrk`](https://github.com/wg/wrk) with the results shown below.

#### Bao.js

```shell
$ wrk -t12 -c 500 -d10s http://localhost:3000/
Running 10s test @ http://localhost:3000/
  12 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    15.38ms    1.47ms  39.19ms   76.59%
    Req/Sec     2.67k   195.60     2.90k    82.33%
  318588 requests in 10.01s, 24.31MB read
  Socket errors: connect 0, read 667, write 0, timeout 0
Requests/sec:  31821.34
Transfer/sec:      2.43MB
```

```typescript
import Bao from "baojs";

const app = new Bao();

app.get("/", (ctx) => {
  return ctx.sendText("OK");
});

app.listen();
```

#### Express.js

Bao.js can handle **3.7x more** requests per second, with an equal **3.7x reduction in latency** per request when compared to Express.js.

```shell
$ wrk -t12 -c 500 -d10s http://localhost:5000/
Running 10s test @ http://localhost:5000/
  12 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    56.34ms   13.42ms 246.38ms   90.62%
    Req/Sec   729.26    124.31     0.88k    86.42%
  87160 requests in 10.01s, 18.95MB read
  Socket errors: connect 0, read 928, write 0, timeout 0
Requests/sec:   8705.70
Transfer/sec:      1.89MB
```

```javascript
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

app.listen(5000);
```

#### Koa.js

Bao.js can handle **1.2x more** requests per second, with an equal **1.2x reduction in latency** per request when compared to the modern Koa.js.

```shell
$ wrk -t12 -c 500 -d10s http://localhost:1234/
Running 10s test @ http://localhost:1234/
  12 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    18.12ms    2.47ms  65.03ms   91.12%
    Req/Sec     2.26k   280.16     4.53k    90.46%
  271623 requests in 10.11s, 42.74MB read
  Socket errors: connect 0, read 649, write 0, timeout 0
Requests/sec:  26877.94
Transfer/sec:      4.23MB
```

```javascript
const Koa = require("koa");
const app = new Koa();

app.use((ctx) => {
  ctx.body = "OK";
});

app.listen(1234);
```

#### Fastify

Bao.js is about equal to Fastify in both throughput and latency.

```shell
$ wrk -t12 -c 500 -d10s http://localhost:5000/
Running 10s test @ http://localhost:5000/
  12 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    15.32ms    1.90ms  60.53ms   78.74%
    Req/Sec     2.68k   274.95     3.25k    72.08%
  319946 requests in 10.01s, 50.65MB read
  Socket errors: connect 0, read 681, write 0, timeout 0
Requests/sec:  31974.36
Transfer/sec:      5.06MB
```

```javascript
const fastify = require("fastify");
const app = fastify({ logger: false });

app.get("/", () => "OK");

app.listen({ port: 5000 });
```

## Contribute

PRs are welcome! If you're looking for something to do, maybe take a look at the Issues?

If updating the README, please stick to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT
