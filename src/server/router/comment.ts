import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const commentRouter = createRouter()
  .query("by-question", {
    input: z.object({
      questionID: z.string(),
    }),
    resolve: async ({ ctx: { prisma }, input }) => {
      const comments = await prisma.comment.findMany({
        where: {
          questionId: input.questionID,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              image: true,
              name: true,
            },
          },
        },
      });
      return comments;
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("post", {
    input: z.object({
      questionId: z.string(),
      content: z.string().max(5000),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const created = await prisma.comment.create({
        data: {
          content: input.content,
          questionId: input.questionId,
          userId: session?.user?.id!,
        },
      });
      return created;
    },
  });
