import { User } from "@nextui-org/react";
import { Quiz } from "@prisma/client";
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
  .mutation("get-many-quizzes", {
    // get quizzes based on progress, and concept
    async resolve({ ctx: { prisma, session } }) {
      // TODO: add query if all relating posts have been checked
      // TODO: filter by Concepts
      const quizzes = await prisma.quiz.findMany({
        take: 10,
        where: {
          progress: {
            every: {
              userId: session?.user?.id as string,
              nextEvaluate: {
                lt: new Date()
              },
            },
          },
        },
      });
      return quizzes;
    },
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
    // create quiz: with interval, easy factor, repetition
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
      const grade = 5;

      if (post.quizId == null) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      // create progress entry if not existing
      const repetitionItem = newRepetition(grade);
      const progressCreated = await prisma.progress.upsert({
        where: {
          progress_identifier: {
            userId: session?.user?.id as string,
            quizId: post.quizId
          }
        },
        update: {},
        create: {
          // TODO: do not add interval in nextEvaluate estimate for demo purposes
          nextEvaluate: new Date(),
          efactor: repetitionItem.efactor,
          interval: repetitionItem.interval,
          userId: session?.user?.id!,
          quizId: post.quizId,
        },
      });
      // Do not update the spaced repetition item if it's an existing item
      // Update the feeds to set viewed as true
      await prisma.feed.update({
        where: {
          feed_identifier: {
            postId: post.id,
            userId: session?.user?.id as string,
          }
        },
        data: {
          viewed: true,
        }
      });
      return;
    },
  })
  .mutation("post-one-quiz-result", {
    // create or update interval, easy factor, repetition per post
    input: z.object({
      quizId: z.number().gt(0),
      grade: z.number().gt(0),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      let grade: SuperMemoGrade = Number(input.grade || "") % 5 as SuperMemoGrade; // 0 ~ 5, type SuperMemoItems

      // if this quiz has already in progress
      const existingProgress = await prisma.progress.findFirst({
        where: {
          userId: session?.user?.id!,
          quizId: input.quizId,
        }
      });

      // create progress entry if not existing
      var progressCreated;
      if (!existingProgress) {
        progressCreated = await prisma.progress.create({
          data: {
            // TODO: add interval to nextEvaluate. Now quizzes are always pending for demo
            nextEvaluate: new Date(),
            efactor: 2.5,
            interval: 1,
            userId: session?.user?.id!,
            quizId: input.quizId,
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
        progressCreated = await prisma.progress.update({
          where: {
            progress_identifier: {
              userId: session?.user?.id!,
              quizId: input.quizId,
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
      }
      if (progressCreated == null) {
        throw new Error("Database update error, spaced repetition failed");
      }

      // populate the feeds with post if grade falls below 3
      if (grade < 3) {
        const postsSuggested = await prisma.post.findMany({
          take: 6 - grade * 2, // 2, 4, or 6
          where: {
            quizzes: {
              id: input.quizId
            },
            NOT: {
              likes: {
                every: {
                  userId: session?.user?.id as string,
                }
              }
            }
          }
        });
        const postsLiked = await prisma.post.findMany({
          take: 2,
          where: {
            quizzes: {
              id: input.quizId
            },
            likes: {
              every: {
                userId: session?.user?.id as string
              }
            }
          }
        });

        for (const post of postsSuggested) {
          const feedsCreated = await prisma.feed.create({
            data: {
              postId: post.id,
              userId: session?.user?.id as string,
              quizId: post.quizId,
              viewed: false,
            }
          });
          if (feedsCreated == null) {
            throw new Error("Cannot create Feeds in DB");
          }
        }
        for (const post of postsLiked) {
          const feedsLikedUpdated = await prisma.feed.update({
            where: {
              feed_identifier: {
                userId: session?.user?.id as string,
                postId: post.id
              }
            },
            data: {
              viewed: false,
            }
          });
        }
      }

      return;
    },
  });
