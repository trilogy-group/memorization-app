import { Follow, Like } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";
import { Dalle } from "node-dalle2";
import { generateAsync } from 'stability-client'
import { generate } from 'stability-client'

interface Dalle2Image {
  buffer : any[],
  filePath: string,
  seed: number,
  mimeType: string,
}

export const recommendationRouter = createRouter()
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
      async resolve({ ctx: { prisma, session }, input }) {
        const imageDescription = input.description;
        console.log("Test")
        console.log(imageDescription)
        
        if (session?.user?.id) {
          /*const api = generate({
            prompt: imageDescription,
            apiKey: process.env.DREAMSTUDIO_API_KEY || '',
          })
          
          api.on('image', ({ buffer, filePath }) => {
            console.log('Image', buffer, filePath)
            var path = filePath
            console.log(path)
            console.log("returning", path)
            return path
          })
          
          api.on('end', (data) => {
            console.log('Generating Complete', data)
          })*/
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
            const path = castImage.images[0].filePath
            console.log("path is: " , path)
            const filename2 = path.split("\\")
            const filename = filename2[filename2.length - 1]
            console.log("filename is: " , filename)
            //move image path to public folder
            const fs = require('fs');
            const path2 = require('path');
            const oldPath = path;
            const newPath = path2.join('./public/images/' + filename);
            fs.copyFile(oldPath, newPath, function (err: any) {
              if (err) throw err;
              console.log('Successfully moved!');
            });
            return {
              filename
            }
          } catch (error) {
            console.log(error)
          }
        }
      },
  });
  
  