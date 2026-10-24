import type { Instrumentation } from "next";

/** Unhandled server errors (route handlers, rendering) go to PostHog error tracking. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { sendException } = await import("./lib/analytics");
  const header = request.headers["x-posthog-distinct-id"];
  await sendException(err, typeof header === "string" ? header : undefined, {
    path: request.path,
    method: request.method,
    route: context.routePath,
    route_type: context.routeType,
  });
};
