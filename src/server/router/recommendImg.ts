import { TRPCError } from "@trpc/server";
import { generateAsync } from 'stability-client'
import { z } from "zod";

import { createRouter } from "./context";

export const imgRecommendationRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("stabledif", {
    input: z.object({
        description: z.string(),
      }),
      async resolve({ ctx: { session }, input }) {
        const imageDescription = input.description;
        
        if (session?.user?.id) {
          try {
            const stabilityImages = await generateAsync({
              prompt: imageDescription,
              apiKey: process.env.DREAMSTUDIO_API_KEY || '',
            })
            const castImage = (stabilityImages as { 
              res: unknown, 
              images: [ 
                { buffer: any[], 
                  filePath: string, 
                  seed: number, 
                  mimeType: string}]})
            const path = require("path")
            const path1 = castImage.images[0].filePath
            const filename = path.parse(path1).base

            //move image path to public folder
            const fs = require('fs');
            const path3 = require('path');
            const oldPath = path1;
            const newPath = path3.join('./public/' + filename);
            fs.copyFile(oldPath, newPath, function (err: any) {
              if (err) throw err;
            });
            return {
              filename
            }
          } catch (error) {
          }
        }
      },
  });
  
  