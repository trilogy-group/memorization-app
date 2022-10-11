import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";


export const notificationRouter = createRouter()
  .mutation("for-you", {
    /*
     * Get 5 notifications based on the timestamp from the DB
     */
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

      let content: string[] = [];
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
      postId: z.string(),
      userId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const postDetails = await prisma.post.findFirst({
          where: {
            id: input.postId as string,
          }
        });

        let notifyString = "";
        if (postDetails?.caption != undefined) {
          if (postDetails?.caption.length > 16) {
            notifyString = input.content + "\"" + postDetails?.caption.slice(0, 16) + ".." + "\"";
          } else {
            notifyString = input.content + "\"" + postDetails?.caption + "\"";
          }
        } else {
          notifyString = input.content;
        }

        await prisma.notification.create({
          data: {
            content: notifyString,
            userId: input.userId,
            postId: input.postId,
            status: 0,
          },
        });
      } catch (e) { console.log(e); throw new Error("Failed to create notification in the database"); }
      return;
    },
  }).mutation("createComment", {
    input: z.object({
      content: z.string(),
      postId: z.string(),
      userId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        const postDetails = await prisma.post.findFirst({
          where: {
            id: input.postId as string,
          }
        });

        let notifyString = input.content;

        await prisma.notification.create({
          data: {
            content: notifyString,
            userId: input.userId,
            postId: input.postId,
            status: 0,
          },
        });
      } catch (e) { console.log(e); throw new Error("Failed to create notification in the database"); }
      return;
    },
  }).mutation("createQuiz", {
    input: z.object({
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      try {
        // Query the quiz
        const progressDetails = await prisma.progress.findMany({
          take: 1,
          where: {
            userId: session?.user?.id as string,
          },
          orderBy: {
            lastEvaluated: "desc",
          },
        });

        for (const item of progressDetails) {
          console.log(item.lastEvaluated);
          // TODO: compare the last evaluation time with the interval
          var notifyString = "Take a quiz now";
          await prisma.notification.create({
            data: {
              content: notifyString,
              userId: session?.user?.id!,
              postId: item.postId,
              status: 0,
            },
          });
        }
      } catch (e) { console.log(e); throw new Error("Failed to create notification in the database"); }
      return;
    },
  });
