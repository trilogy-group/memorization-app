import { FeedItem } from "@/utils/text";
import { Follow, Like, Quiz, Post } from "@prisma/client";
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
      // TODO: add cursor and skip for quiz
      /**     
            const items = await prisma.post.findMany({
              take: 4,
              skip,
              select: {
                id: true,
      
                user: true,
                quizzes: true,
                _count: { select: { likes: true, comments: true } },
                Feed: {
                  where: {
                    AND:[
                      {userId: session?.user?.id!}, 
                      {viewed: false}
                    ]
                  }
                },
              },
              orderBy: {
                likes: {
                  _count: "desc"
                }
              },
              }
            );
      
       */
      /*
      const items = await prisma.post.findMany({
        take: 4,
        skip,
        where: {
          Feed: {
            every: {
              AND: [
              { userId: session?.user?.id! },
              { viewed: false }
            ]
          }
          }
        },
        select: {
          id: true,
          userId: true,
          caption: true,
          videoURL: true,
          coverURL: true,
          contentType: true,
          createdAt: true,
          updatedAt: true,
          quizId: true,
          videoHeight: true,
          videoWidth: true,
          mnemonic_text: true,
          quizzes: true,
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: {
          likes: {
            _count: "desc"
          }
        },
      }
      );
      */

      // Change two queries into one
      const feedItems = await prisma.feed.findMany({
        where: {
          userId: session?.user?.id as string,
        },
        select: {
          postId: true,
        }
      });
      console.log(feedItems);

      const feedPostIdArr = feedItems.map((feed) => feed.postId);

      const items = await prisma.post.findMany({
        take: 4,
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

      console.log("cursor", input.cursor);
      console.log("items.length", items.length);
      for (const i of items) {
        console.log("items", i.caption);
      }
      console.log("skip", skip);

      // get the quizzes
      let quizzes: Quiz[];
      let coverURLs_or_mnemonicTexts: string[] = [];
      let efactors: number[] = [];

      const viewedFeeds = await prisma.feed.findMany({
        where: {
          userId: session?.user?.id as string,
          viewed: true,
        },
        select: {
          quizId: true
        }
      });

      // quizzes for the viewed feeds
      // TODO: implement skip, fix viewed reset bugs
      quizzes = await prisma.quiz.findMany({
        skip,
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
        },
      });
      console.log("all feeds have been viewed", quizzes);
      // TODO: if the last quiz was correct, then the posts will not be shown, the quiz will still appear
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
    async resolve({ ctx: { prisma, session }, input }) {
      console.log("conceptid", input.conceptId as string);
      console.log("idInconcept", input.quizId as string);
      const quizFound = await prisma.quiz.findFirst({
        where: {
          conceptId: 'CO164', // input.conceptId,
          idInConcept: 'GQ5079e922-4bdb-11ed-ae21-12a7910fac19'//input.quizId as string,
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

