import type { Context, Next } from "hono";

import { createLogger } from "@neptu/logger";

const log = createLogger({ name: "api" });

let reqCounter = 0;

function nextReqId(): string {
  reqCounter += 1;
  return `req-${reqCounter.toString(36)}`;
}

export async function requestLogger(c: Context, next: Next) {
  const reqId = nextReqId();
  const startTime = performance.now();
  const url = new URL(c.req.url);

  log.info(
    {
      reqId,
      req: {
        method: c.req.method,
        url: url.pathname + url.search,
        host: url.host,
        remoteAddress: c.req.header("x-forwarded-for") ?? "127.0.0.1",
        remotePort: Number(c.req.header("x-forwarded-port")) || undefined,
      },
    },
    "incoming request"
  );

  await next();

  const responseTime = performance.now() - startTime;

  if (c.res.status >= 400) {
    log.error(
      {
        reqId,
        res: { statusCode: c.res.status },
        responseTime,
      },
      "request failed"
    );
  } else {
    log.info(
      {
        reqId,
        res: { statusCode: c.res.status },
        responseTime,
      },
      "request completed"
    );
  }
}
