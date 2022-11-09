import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";


export const moderationRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("remove", {
    input: z.object({
      postId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const deletedPost = await prisma.post.delete({
          where: { id: input.postId },
        })
      } catch (e) { console.error(e); throw new Error("No such post in the database"); }
      return null;
    },
  }).mutation("isModerator", {
    input: z.object({}),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const isAdmin = await prisma.user.findFirst({
          where: { id: session?.user?.id as string, admin: true },
        })
        return isAdmin;
      } catch (e) { console.error(e); throw new Error("Failed to access admin information in the database"); }
    },
  });
