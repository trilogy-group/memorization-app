import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const likeRouter = createRouter()
  .query("count", {
    input: z.object({
      questionId: z.string(),
    }),
    resolve: async ({ ctx: { prisma }, input }) => {
      const count = await prisma.like.count({
        where: {
          questionId: input.questionId,
        },
      });
      return {
        count,
      };
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("toggle", {
    input: z.object({
      questionId: z.string(),
      isLiked: z.boolean(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      if (input.isLiked) {
        await prisma.like.create({
          data: {
            questionId: input.questionId,
            userId: session?.user?.id!,
          },
        });
      } else {
        await prisma.like.delete({
          where: {
            questionId_userId: {
              userId: session?.user?.id!,
              questionId: input.questionId,
            },
          },
        });
      }
      return {
        message: "OK",
      };
    },
  });
