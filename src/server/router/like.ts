import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const likeRouter = createRouter()
  .query("count", {
    input: z.object({
      postId: z.string(),
    }),
    resolve: async ({ ctx: { prisma }, input }) => {
      const count = await prisma.like.count({
        where: {
          postId: input.postId,
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
      postId: z.string(),
      isLiked: z.boolean(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      if (input.isLiked) {
        await prisma.like.create({
          data: {
            postId: input.postId,
            userId: session?.user?.id!,
          },
        });
      } else {
        await prisma.like.delete({
          where: {
            postId_userId: {
              userId: session?.user?.id!,
              postId: input.postId,
            },
          },
        });
      }
      return {
        message: "OK",
      };
    },
  });
