import { getGlobalTraceProvider } from '@openai/agents';
import type { Context, Env } from '@cloudflare/workers-types';

export default {
  async fetch(request: Request, env: Env, ctx: Context): Promise<Response> {
    try {
      // your agent code here
      return new Response(`success`);
    } catch (error) {
      console.error(error);
      return new Response(String(error), { status: 500 });
    } finally {
      // make sure to flush any remaining traces before exiting
      ctx.waitUntil(getGlobalTraceProvider().forceFlush());
    }
  },
};
