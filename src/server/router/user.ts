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
