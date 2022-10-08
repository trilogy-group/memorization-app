import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const notificationRouter = createRouter()
  .query("for-you", {
    /*
     * Get 5 notifications based on the timestamp from the DB
     */
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {

      const items = await prisma.notification.findMany({
        take: 5,
        where: {
          userId: session?.user?.id as string,
        },
        orderBy: {
          lastUpdated: "desc",
        },
      });

      let content: String[] = [];
      let status: number[] = [];
      for (const i of items) {
        content.push(i.content);
        status.push(i.status);
      }

      return { "content": content, "status": status };
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("createLike", {
    input: z.object({
      content: z.string(),
      questionId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const questionDetails = await prisma.question.findFirst({
          where: {
            id: input.questionId as string,
          }
        });

        let notifyString = "";
        console.log(input.content);
        console.log(questionDetails?.caption);
        if (questionDetails?.caption != undefined) {
          if (questionDetails?.caption.length > 16) {
            notifyString = input.content + "\"" + questionDetails?.caption.slice(0, 16) + ".." + "\"";
          } else {
            notifyString = input.content + "\"" + questionDetails?.caption + "\"";
          }
        } else {
          notifyString = input.content;
        }

        await prisma.notification.create({
          data: {
            content: notifyString,
            userId: session?.user?.id!,
            questionId: input.questionId,
            status: 0,
          },
        });
      } catch (e) { console.log(e); throw new Error("Failed to create notification in the database"); }
      return;
    },
  }).mutation("createComment", {
    input: z.object({
      content: z.string(),
      questionId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const questionDetails = await prisma.question.findFirst({
          where: {
            id: input.questionId as string,
          }
        });

        let notifyString = input.content;

        await prisma.notification.create({
          data: {
            content: notifyString,
            userId: session?.user?.id!,
            questionId: input.questionId,
            status: 0,
          },
        });
      } catch (e) { console.log(e); throw new Error("Failed to create notification in the database"); }
      return;
    },
  });

;

