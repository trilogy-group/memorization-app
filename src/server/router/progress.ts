import { Post, Progress } from "@prisma/client";
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
          nextEvaluate: {
            lt: new Date()
          }
        },
        orderBy: {
          // quizzes from the most recent ones
          nextEvaluate: "asc"
        }
      });
      if (existingProgress == null) {
        return null;
      }
      const quizId = existingProgress?.quizId;
      console.log(existingProgress);
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId
        }
      });

      // create progress entry if not existing
      return quiz;
    },
  })
  .mutation("post-got-it", {
    // create or update interval, easy factor, repetition per post
    input: z.object({
      postId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const post = await prisma.post.findFirst({
        where: {
          id: input.postId,
        }
      });

      if (post == null) {
        throw new Error("Post not found!");
      }
      const id = post.quizId;
      const grade = 5;

      if (id == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          quizId: id,
        }
      });

      // create progress entry if not existing
      if (!existingProgress) {
        const repetitionItem = newRepetition(grade);
        const created = await prisma.progress.create({
          data: {
            // TODO: do not add interval in nextEvaluate estimate for demo purposes
            nextEvaluate: new Date(),
            efactor: repetitionItem.efactor,
            interval: repetitionItem.interval,
            userId: session?.user?.id!,
            quizId: id,
          }
        });
      }
      // Do not update the spaced repetition item if it's an existing item
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
      const post = await prisma.post.findFirst({
        where: {
          id: input.postId,
        }
      });

      if (post == null || !post.quizId) {
        throw new Error("Post not found or post missing quizId!");
      }

      const id = post.quizId;

      let grade: SuperMemoGrade = Number(input.grade || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

      // if this post has already been viewed
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          quizId: id,
        }
      });

      // create progress entry if not existing
      if (!existingProgress) {
        const created = await prisma.progress.create({
          data: {
            // TODO: add interval to nextEvaluate. Now quizzes are always pending for demo
            nextEvaluate: new Date(),
            efactor: 2.5,
            interval: 1,
            userId: session?.user?.id!,
            quizId: id,
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
              quizId: id,
            }
          },
          data: {
            // TODO: add interval to the next evaluate time
            nextEvaluate: new Date(),
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
  }).mutation("get-data-about-quiz-mnemonic-and-difficulty-using-quizId", {
    input: z.object({
      quizId: z.number(),
    }),

    async resolve({ ctx: { prisma, session }, input }) {
      const post = await prisma.post.findFirst({
        where: {
          quizId: input.quizId,
        }
      });
      console.log("quiz id that is used to search ", input.quizId);
      console.log("here is the post ", post);

      if (post == null || !post.quizId) {
        throw new Error("Post not found or post missing quizId!");
      }

      const progress = await prisma.progress.findFirst({
        where: {
          quizId: input.quizId,
          userId: session?.user?.id!
        }
      });

      console.log("here is the progress ", progress);

      if (progress == null || !progress.quizId) {
        throw new Error("progress not found or progress missing quizId!");
      }

      return { post, progress };
    },
  }).mutation("get-many-quizzes", {
    // get quizzes based on progress
    async resolve({ ctx: { prisma, session } }) {
      const existingProgress = await prisma.progress.findMany({
        where: {
          userId: session?.user?.id!,
          nextEvaluate: {
            lt: new Date()
          }
        },
        orderBy: {
          // quizzes from the most recent ones
          nextEvaluate: "asc"
        }
      });
      if (existingProgress == null) {
        return null;
      }

      let quizIds: number[] = [];
      existingProgress?.forEach(progress => { quizIds.push(progress.quizId) });
      console.log("quiz ids are", quizIds);

      const quizzes = await prisma.quiz.findMany({
        where: {
          id: { in: quizIds }
        }
      });

      let progresses: Progress[] = []
      let posts: Post[] = []
      for (let i = 0; i < quizIds.length; i++) {
        let post = await prisma.post.findFirst({
          where: {
            quizId: quizIds[i],
          }
        });
        if (post != null) {
          posts.push(post);
        }

        let progress = await prisma.progress.findFirst({
          where: {
            quizId: quizIds[i],
          }
        });
        if (progress != null) {
          progresses.push(progress);
        }

      }

      // create progress entry if not existing
      return { quizzes, progresses, posts };
    },
  });
