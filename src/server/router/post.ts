import { FeedItem } from "@/utils/text";
import { Follow, Like, Quiz, Post } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

import * as fs from "fs";
import * as AWS from "aws-sdk";

const BUCKET_NAME = process.env.BUCKET_NAME;
const IAM_USER_KEY = process.env.IAM_USER_KEY;
const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

const s3bucket = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET
});

function uploadToS3(fileName: string): Promise<any> {
  const readStream = fs.createReadStream("./public/" + fileName);

  const params = {
    Bucket: BUCKET_NAME as string,
    Key: fileName,
    Body: readStream
  };

  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function (err: any, data: { Location: string; }) {
      readStream.destroy();

      if (err) {
        return reject(err);
      }
      return resolve(data.Location);
    });
  });
}

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
      // TODO: add cursor and skip for quiz
      // TODO: Change two queries into one
      const feedItems = await prisma.feed.findMany({
        where: {
          userId: session?.user?.id as string,
          viewed: false,
        },
        select: {
          postId: true,
        }
      });

      const feedPostIdArr = feedItems.map((feed) => feed.postId);

      const items = await prisma.post.findMany({
        take: 2,
        skip,
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
        where: {
          id: { in: feedPostIdArr }
        }
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

      // get the quizzes
      let quizzes: Quiz[];

      const progress = await prisma.progress.findMany({
        where: {
          userId : session?.user?.id as string,
          nextEvaluate: {
            lt: new Date()
          }
        },
        select: {
          quizId: true,
        }
      });

      const quizIdArr = progress.map((q) => q.quizId);

      // quizzes for the viewed feeds
      quizzes = await prisma.quiz.findMany({
        skip: skip == 0 ? 0 : Number.MAX_SAFE_INTEGER,
        where: {
          progress: {
            some: {
              userId: session?.user?.id as string,
              nextEvaluate: {
                lt: new Date()
              }
            }
          },
          //id: { in: viewedFeeds.map((f) => { return f.quizId; }) }
          id: { in: quizIdArr }
        },
      });
      // TODO: if feeds are incomplete, do not add the quiz

      const posts = items.map((item) => {
        return {
          ...item,
          likedByMe: likes.some((like) => like.postId === item.id),
          followedByMe: followings.some(
            (following) => following.followingId === item.userId
          )
        }
      });

      const results: FeedItem[] = []
      posts.forEach((post) => {
        results.push({ type: "Post", post: post })
      })
      results.push({ type: 'Quiz', quizzes: quizzes })

      return {
        items: results,
        nextSkip: items.length === 0 ? null : skip + items.length,
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
        nextSkip: items.length === 0 ? skip : skip + items.length,
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
    // TODO: test whether quizFound works properly
    async resolve({ ctx: { prisma, session }, input }) {
      const quizFound = await prisma.quiz.findFirst({
        where: {
          conceptId: input.conceptId,
          idInConcept: input.quizId as string,
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
      coverURL: z.string(),
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
  })
  .mutation("uploadToS3", {
    input: z.object({
      file: z.string(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const Location: String = (await uploadToS3(input.file)) as string;
      return Location;
    },
  }).mutation("getHint", {
    input: z.object({
      quizId: z.number(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const hintFound = await prisma.post.findFirst({
        where: {
          quizId: input.quizId,
        },
        select: {
          coverURL: true,
        }
      });

      if (hintFound == null) {
        throw new Error("Concept or quiz not found in the DB.");
      }
      return hintFound.coverURL as string;
    },
  }).mutation("getConcept", {
    input: z.object({
      quizId: z.number(),
    }),
    async resolve({ ctx: { prisma, session }, input }) {
      const conceptFound = await prisma.quiz.findFirst({
        where: {
          id: input.quizId,
        },
        select: {
          concepts: true,
        }
      });
      if (conceptFound == null) {
        throw new Error("Concept or quiz not found in the DB.");
      }
      return conceptFound.concepts.name as string;
    }
  });


