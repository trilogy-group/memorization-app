import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";
import { Dalle } from "node-dalle2";
import { generate } from 'stability-ts'



// Add Session key
const dalle = new Dalle({ apiKey: "sess-ONCM0Wl54k3IR49II8zDMvnA3OAUVKRDdVHYl0sL" });

// Create an async function 
export const getDalle2Images = async (caption: string) => {

    // Call the Dall-e 2 API
    const response = await dalle.generate(caption);

    // If Dall-e 2 couldn't generate images from the given caption
    if (!response) {
        console.error(
        "Dall-e 2 couldn't generate images based upon the given caption."
        );
        return null;
    }

    // Get the image array from the response object
    const { data } = response;

    // Return the image array
    return data;
};

export const recommendationRouter = createRouter()
  .query("image", {
    input: z.object({
      description: z.string(),
    }),
    resolve: async ({ ctx: { prisma, session }, input }) => {
      const imageDescription = input.description;
      if (session?.user?.id) {
        getDalle2Images(imageDescription)
            .then((data) => {
                
                // If the image array is empty for some reason
                if (!data) {
                console.error("Something has gone horribly wrong...");
                return null;
                }

                // Log the image array
                console.log(data);
                return {
                    data
                  };
            })
            // Log the error if one occurs
            .catch((err) => {
                console.error(err);
            });
      }
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
  .mutation("create", {
    input: z.object({
        description: z.string(),
      }),
      async resolve({ ctx: { prisma, session }, input }) {
        const imageDescription = input.description;
        console.log("Test")
        console.log(imageDescription)
        
        if (session?.user?.id) {
            const dalle = new Dalle({apiKey:'sess-ONCM0Wl54k3IR49II8zDMvnA3OAUVKRDdVHYl0sL'}); // Bearer Token 

            const generations = await dalle.generate(imageDescription);
            
            console.log(generations)
        }
      },
  });
  