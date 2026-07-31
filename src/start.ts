import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { getAdminToken } from "./lib/admin-token";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Attach the admin session token to every server-fn RPC. The server fns that
// care will read it from x-admin-token via getRequestHeader. Other server fns
// simply ignore the header.
const attachAdminToken = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getAdminToken();
  if (!token) return next();
  return next({ headers: { "x-admin-token": token } });
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth, attachAdminToken],
}));
