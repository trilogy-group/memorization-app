import { TRPCError } from "@trpc/server";
import { z } from "zod";

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
      const user = await prisma.user.findFirst({
        where: {
          AND: [
            { id: session?.user?.id as string },
            {
              concepts: {
                some: { id: input.conceptId }
              }
            }]
        },
      });
      // If the concept exists, take no action
      // TODO: apply proper logging
      if (user != null) {
        console.log("concept exists", input.conceptId);
        return;
      } else {
        console.log('add concept for the user');
      }
      // The concept is new, add the relation, and the feed
      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          concepts: {
            connect: { id: input.conceptId }
          },
        },
      });
      const postSuggested = await prisma.post.findMany({
        take: 5,
        where: {
          quizzes: {
            concepts: {
              id: input.conceptId,
            }
          }
        }
      });
      const feedsCreated = await prisma.feed.createMany({
        data: postSuggested.map((post) => ({
          postId: post.id,
          userId: session?.user?.id as string,
          quizId: post.quizId,
          viewed: false,
          conceptId: input.conceptId,
        }))
      });
      return feedsCreated;
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
      return;
    },
  });
