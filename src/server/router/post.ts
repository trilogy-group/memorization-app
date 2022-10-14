import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

enum contentType {
  image = 1,
  video = 2,
  text = 3,
  unknown = 4,
}

export const postRouter = createRouter()
  .query("for-you", {
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const skip = input.cursor || 0;
      const items = await prisma.post.findMany({
        take: 10,
        skip,
        where: {
          Feed: {
            // concept filter is not needed, because they are applied when we add posts to the feed
            every: {
              userId: session?.user?.id as string,
              viewed: false,
            }
          }
        },
        include: {
          user: true,
          quizzes: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: {
          likes: {
            _count: "desc"
          }
        },
      });
      let likes: Like[] = [];
      let followings: Follow[] = [];

      if (session?.user?.id) {
        [likes, followings] = await Promise.all([
          prisma.like.findMany({
            where: {
              userId: session.user.id,
              postId: { in: items.map((item) => item.id) },
            },
          }),
          prisma.follow.findMany({
            where: {
              followerId: session.user.id,
              followingId: {
                in: items.map((item) => item.userId),
              },
            },
          }),
        ]);
      }

      return {
        items: items.map((item) => ({
          ...item,
          likedByMe: likes.some((like) => like.postId === item.id),
          followedByMe: followings.some(
            (following) => following.followingId === item.userId
          ),
        })),
        nextSkip: items.length === 0 ? null : skip + 10,
      };
    },
  })
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .query("following", {
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const followingIds = (
        await prisma.follow.findMany({
          where: {
            followerId: session?.user?.id!,
          },
          select: {
            followingId: true,
          },
        })
      ).map((item) => item.followingId);

      const skip = input.cursor || 0;
      const items = await prisma.post.findMany({
        take: 10,
        skip,
        where: {
          userId: { in: followingIds },
        },
        include: {
          user: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      let likes: Like[] = [];
      let followings: Follow[] = [];

      [likes, followings] = await Promise.all([
        prisma.like.findMany({
          where: {
            userId: session?.user?.id!,
            postId: { in: items.map((item) => item.id) },
          },
        }),
        prisma.follow.findMany({
          where: {
            followerId: session?.user?.id!,
            followingId: {
              in: items.map((item) => item.userId),
            },
          },
        }),
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          likedByMe: likes.some((like) => like.postId === item.id),
          followedByMe: followings.some(
            (following) => following.followingId === item.userId
          ),
        })),
        nextSkip: items.length === 0 ? null : skip + 10,
      };
    },
  })
  .mutation("createVideo", {
    input: z.object({
      caption: z.string(),
      videoURL: z.string().url(),
      coverURL: z.string().url(),
      videoWidth: z.number().gt(0),
      videoHeight: z.number().gt(0),
      conceptId: z.string(),
      quizId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const quizFound = await prisma.quiz.findFirst({
        where: {
          concepts: {
            id: input.conceptId,
          }
        }
      });

      if (quizFound == null) {
        throw new Error("Concept or quiz not found in the DB.");
      }

      const postCreated = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: input.videoURL,
          coverURL: input.coverURL,
          videoWidth: input.videoWidth,
          videoHeight: input.videoHeight,
          mnemonic_text: "",
          contentType: contentType.video,
          userId: session?.user?.id!,
          quizId: quizFound.id,
        },
      });

      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          points: { increment: 1 },
        },
      });

      return postCreated;
    },
  })
  .mutation("createImg", {
    input: z.object({
      caption: z.string(),
      coverURL: z.string().url(),
      conceptId: z.string(),
      quizId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const quizFound = await prisma.quiz.findFirst({
        where: {
          concepts: {
            id: input.conceptId,
          }
        }
      });

      if (quizFound == null) {
        throw new Error("Concept or quiz not found in the DB.");
      }

      const created = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: "",
          coverURL: input.coverURL,
          videoWidth: 0,
          videoHeight: 0,
          mnemonic_text: "",
          userId: session?.user?.id!,
          contentType: contentType.image,
          quizId: quizFound.id
        },
      });
      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          points: { increment: 1 },
        },
      });
      return created;
    },
  })
  .mutation("createText", {
    input: z.object({
      caption: z.string(),
      concept: z.string(),
      mnemonic_text: z.string(),
      conceptId: z.string(),
      quizId: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const quizFound = await prisma.quiz.findFirst({
        where: {
          concepts: {
            id: input.conceptId,
          }
        }
      });

      if (quizFound == null) {
        throw new Error("Concept or quiz not found in the DB.");
      }

      const created = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: "",
          coverURL: "",
          videoWidth: 0,
          videoHeight: 0,
          mnemonic_text: input.mnemonic_text,
          userId: session?.user?.id!,
          contentType: contentType.text,
          quizId: quizFound.id,
        },
      });
      await prisma.user.update({
        where: { id: session?.user?.id as string },
        data: {
          points: { increment: 1 },
        },
      });
      return created;
    },
  });

