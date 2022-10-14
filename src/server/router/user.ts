import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createRouter } from "./context";

export const userRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("addConcept", {
    input: z.object({
      conceptId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          concepts: { 
            connect: {id: input.conceptId}
          },
        },
      });
      const postSuggested = await prisma.post.findMany({
        take: 5,
        where: {
          concepts: {
            id: input.conceptId,
          }
        }
      });
      const feedsCreated = await prisma.feed.createMany({
        data: postSuggested.map((post) => ({
          postId: post.id,
          userId: session?.user?.id as string,
          quizId: post.quizId,
          viewed: false,
        }))
      });
      return ;
    },
  })
  .mutation("score", {
    input: z.object({
      score: z.number().gt(0),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          points: { increment: input.score },
        },
      });
      return ;
    },
  });
