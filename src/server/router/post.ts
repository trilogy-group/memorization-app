import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

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
        include: {
          user: true,
          quizzes: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: {
          createdAt: "desc",
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
      concept: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const conceptFound = await prisma.concept.findFirst({
        where: {
          id: input.concept
        }
      });
      if (conceptFound == null) {
        throw new Error("Concept table not populated in the DB.");
      }
      const postCreated = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: input.videoURL,
          coverURL: input.coverURL,
          videoWidth: input.videoWidth,
          videoHeight: input.videoHeight,
          userId: session?.user?.id!,
          contentType: 2,
          conceptId: conceptFound?.id,
          mnemonic_text: "",
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
      concept: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const conceptFound = await prisma.concept.findFirst({
        where: {
          id: input.concept
        }
      });
      if (conceptFound == null) {
        throw new Error("Concept table not populated in the DB.");
      }
      const created = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: "",
          coverURL: input.coverURL,
          videoWidth: 0,
          videoHeight: 0,
          userId: session?.user?.id!,
          contentType: 1,
          conceptId: conceptFound?.id,
          mnemonic_text: "",
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
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const conceptFound = await prisma.concept.findFirst({
        where: {
          id: input.concept
        }
      });
      if (conceptFound == null) {
        throw new Error("Concept table not populated in the DB.");
      }
      const created = await prisma.post.create({
        data: {
          caption: input.caption,
          videoURL: "",
          coverURL: "",
          videoWidth: 0,
          videoHeight: 0,
          userId: session?.user?.id!,
          contentType: 3,
          conceptId: conceptFound?.id,
          mnemonic_text: input.mnemonic_text,
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

