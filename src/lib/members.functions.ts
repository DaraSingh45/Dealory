import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EmailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const joinMembers = createServerFn({ method: "POST" })
  .inputValidator((input) => EmailSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("members")
      .insert({ email: data.email });

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, reason: "duplicate" as const };
      }
      if (error.code === "23514") {
        return { ok: false as const, reason: "invalid" as const };
      }
      return { ok: false as const, reason: "error" as const };
    }
    return { ok: true as const };
  });
