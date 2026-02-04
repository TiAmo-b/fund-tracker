/// <reference types="@cloudflare/workers-types" />

interface Env {
  // 如果需要绑定 KV、D1 等资源，在这里定义
}

type PagesFunction<E = Env> = (context: EventContext<E, string, unknown>) => Response | Promise<Response>;
