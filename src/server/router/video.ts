import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const videoRouter = createRouter()
  .query("for-you", {
    input: z.object({
      cursor: z.number().nullish(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const skip = input.cursor || 0;
      const items = await prisma.video.findMany({
        take: 10,
        skip,
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

      if (session?.user?.id) {
        [likes, followings] = await Promise.all([
          prisma.like.findMany({
            where: {
              userId: session.user.id,
              videoId: { in: items.map((item) => item.id) },
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
          likedByMe: likes.some((like) => like.videoId === item.id),
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
      const items = await prisma.video.findMany({
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
            videoId: { in: items.map((item) => item.id) },
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
          likedByMe: likes.some((like) => like.videoId === item.id),
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
      tagStr: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      let alltags = input.tagStr.match(/(#[a-z\d-]+)/gi);
      let alltagid = [];
      /*
       * Tags hardcoded in the frontend src/upload.tsx are created in the DB, therefore "tagcreated"
       * TODO: provided subject/chapter tags in the DB
       */
      if (alltags == null) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      for (const t_ of alltags) {
        const tagcreated = await prisma.hashtag.findUnique({
          where: {
            tag: t_,
          }
        });

        if (tagcreated == null) {
          const tagcreated = await prisma.hashtag.create({
            data: {
              tag: t_,
            },
          });
          alltagid.push({ id: tagcreated.id });
        } else {
          alltagid.push({ id: tagcreated.id });
        }
      }
      const created = await prisma.video.create({
        data: {
          caption: input.caption,
          videoURL: input.videoURL,
          coverURL: input.coverURL,
          videoWidth: input.videoWidth,
          videoHeight: input.videoHeight,
          userId: session?.user?.id!,
          contentType: 2,
          hashtags: {
            connect: alltagid,
          }, // connect to all hashtags
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
  .mutation("createImg", {
    input: z.object({
      caption: z.string(),
      coverURL: z.string().url(),
      tagStr: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      let alltags = input.tagStr.match(/(#[a-z\d-]+)/gi);
      let alltagid = [];
      /*
       * Tags hardcoded in the frontend src/upload.tsx are created in the DB, therefore "tagcreated"
       * TODO: provided subject/chapter tags in the DB
       */
      if (alltags == null) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }
      for (const t_ of alltags) {
        const tagcreated = await prisma.hashtag.findUnique({
          where: {
            tag: t_,
          }
        });

        if (tagcreated == null) {
          const tagcreated = await prisma.hashtag.create({
            data: {
              tag: t_,
            },
          });
          alltagid.push({ id: tagcreated.id });
        } else {
          alltagid.push({ id: tagcreated.id });
        }
      }
      const created = await prisma.video.create({
        data: {
          caption: input.caption,
          videoURL: "",
          coverURL: input.coverURL,
          videoWidth: 0,
          videoHeight: 0,
          userId: session?.user?.id!,
          contentType: 1,
          hashtags: {
            connect: alltagid,
          }, // connect to all hashtags
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

