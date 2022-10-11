import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getRepetition, newRepetition, SuperMemoItem, SuperMemoGrade } from "../../utils/spacedRepetition";

import { createRouter } from "./context";


export type ProgressWhereUniqueInput = {
  postId?: string | null,
  userId?: string | null,
}


export const progressRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("get-one-quiz", {
    // get quizzes based on progress
    async resolve({ ctx: { prisma, session } }) {
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          lastEvaluated: {
            lt: new Date()
          }
        },
        orderBy: {
          lastEvaluated: "desc"
        }
      });
      if (existingProgress == null) {
        return null;
      }
      const postId = existingProgress?.postId;
      console.log(existingProgress);
      const post = await prisma.post.findFirst({
        where: {
          id: postId
        }
      });
      console.log("the question", question);

      // create progress entry if not existing
      return post;
    },
  })
  .mutation("post-got-it", {
    // create or update interval, easy factor, repetition per post
    input: z.object({
      postId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const id = input.postId;
      const grade = 5;

      if (id == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          postId: id,
        }
      });

      // create progress entry if not existing
      if (!existingProgress) {
        const repetitionItem = newRepetition(grade);
        const created = await prisma.progress.create({
          data: {
            efactor: repetitionItem.efactor,
            interval: repetitionItem.interval,
            userId: session?.user?.id!,
            postId: id,
          }
        });
      }
      else {
        // update the spaced repetition item if it's an existing item
        let item: SuperMemoItem = {
          interval: existingProgress.interval,
          repetition: existingProgress.repetition,
          efactor: existingProgress.efactor,
        };
        const repetitionItem = await getRepetition(item, grade);
        const created = await prisma.progress.update({
          where: {
            progress_identifier: {
              userId: session?.user?.id!,
              postId: id
            }
          },
          data: {
            efactor: repetitionItem.efactor,
            interval: repetitionItem.interval,
            repetition: repetitionItem.repetition
          }
        });
        if (created == null) {
          throw new Error("Database update error, spaced repetition failed");
        }
      }
      return;
    },
  })
  .mutation("post-one-quiz-result", {
    // create or update interval, easy factor, repetition per post
    input: z.object({
      postId: z.string(),
      grade: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const id = input.postId;
      let grade: SuperMemoGrade = Number(input.grade || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

      if (id == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          postId: id,
        }
      });

      // create progress entry if not existing
      if (!existingProgress) {
        const created = await prisma.progress.create({
          data: {
            efactor: 2.5,
            interval: 1,
            userId: session?.user?.id!,
            postId: id,
          }
        });
      }
      else {
        // update the spaced repetition item if it's an existing item
        let item: SuperMemoItem = {
          interval: existingProgress.interval,
          repetition: existingProgress.repetition,
          efactor: existingProgress.efactor,
        };
        const repetitionItem = await getRepetition(item, grade);
        const created = await prisma.progress.update({
          where: {
            progress_identifier: {
              userId: session?.user?.id!,
              postId: id
            }
          },
          data: {
            efactor: repetitionItem.efactor,
            interval: repetitionItem.interval,
            repetition: repetitionItem.repetition
          }
        });
        if (created == null) {
          throw new Error("Database update error, spaced repetition failed");
        }
      }
      return;
    },
  })
  .mutation("post-multiple-quiz-results", {
    // create or update interval, easy factor, repetition per post
    input: z.object({
      postIdArr: z.string(),
      quizScoreArr: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const postIdArr = input.postIdArr.split(';');
      const quizScores = input.quizScoreArr.split(';');
      for (var i = 0; i < postIdArr.length; i++) {
        const id = postIdArr[i];
        let grade: SuperMemoGrade = Number(quizScores[i] || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

        if (id == null) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        const existingProgress = await prisma.progress.findFirst({
          where: {
            userId: session?.user?.id!,
            postId: id,
          }
        });

        // create progress entry if not existing
        if (!existingProgress) {
          const created = await prisma.progress.create({
            data: {
              efactor: 2.5,
              interval: 0,
              userId: session?.user?.id!,
              postId: id,
            }
          });
        }
        else {
          let item: SuperMemoItem = {
            interval: existingProgress.interval,
            repetition: existingProgress.repetition,
            efactor: existingProgress.efactor,
          };
          const repetitionItem = await getRepetition(item, grade);
          const created = await prisma.progress.update({
            where: {
              progress_identifier: {
                userId: session?.user?.id!,
                postId: id
              }
            },
            data: {
              efactor: repetitionItem.efactor,
              interval: repetitionItem.interval,
              repetition: repetitionItem.repetition
            }
          });
          if (created == null) {
            throw new Error("Database update error, spaced repetition failed");
          }
        }
      }
      return null;
    },
  });
