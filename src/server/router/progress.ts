import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getRepetition, newRepetition, SuperMemoItem, SuperMemoGrade } from "../../utils/spacedRepetition";

import { createRouter } from "./context";


export type ProgressWhereUniqueInput = {
  questionId?: string | null,
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
    input: z.object({}),
    async resolve({ ctx: { prisma, session }, input }) {
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
      const questionId = existingProgress?.questionId;
      console.log(existingProgress);
      const question = await prisma.question.findFirst({
        where: {
          id: questionId
        }
      });

      // create progress entry if not existing
      return question;
    },
  })
  .mutation("post-got-it", {
    // create or update interval, easy factor, repetition per question
    input: z.object({
      questionId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const id = input.questionId;
      const grade = 5;

      if (id == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          questionId: id,
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
            questionId: id,
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
              questionId: id
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
    // create or update interval, easy factor, repetition per question
    input: z.object({
      questionId: z.string(),
      grade: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const id = input.questionId;
      let grade: SuperMemoGrade = Number(input.grade || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

      if (id == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          questionId: id,
        }
      });

      // create progress entry if not existing
      if (!existingProgress) {
        const created = await prisma.progress.create({
          data: {
            efactor: 2.5,
            interval: 1,
            userId: session?.user?.id!,
            questionId: id,
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
              questionId: id
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
    // create or update interval, easy factor, repetition per question
    input: z.object({
      questionIdArr: z.string(),
      quizScoreArr: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const questionIdArr = input.questionIdArr.split(';');
      const quizScores = input.quizScoreArr.split(';');
      for (var i = 0; i < questionIdArr.length; i++) {
        const id = questionIdArr[i];
        let grade: SuperMemoGrade = Number(quizScores[i] || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

        if (id == null) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        const existingProgress = await prisma.progress.findFirst({
          where: {
            userId: session?.user?.id!,
            questionId: id,
          }
        });

        // create progress entry if not existing
        if (!existingProgress) {
          const created = await prisma.progress.create({
            data: {
              efactor: 2.5,
              interval: 0,
              userId: session?.user?.id!,
              questionId: id,
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
                questionId: id
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
