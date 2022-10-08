import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getRepetition, newRepetition, SuperMemoItem } from "../../utils/spacedRepetition";

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
  .mutation("post-quiz-results", {
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
        const grade = quizScores[i] == "true" ? 5 : 0;

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
