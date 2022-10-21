import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";
import { generateAsync } from "stability-client";

export const recommendationRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("acronym", {
    input: z.object({
      description: z.string(),
    }),
    async resolve({ ctx: { session }, input }) {
      const { Configuration, OpenAIApi } = require("openai");
      const wordList = input.description;

      if (session?.user?.id) {
        try {
          const { Configuration, OpenAIApi } = require("openai");

          const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);

          const completion = await openai.createCompletion({
            max_tokens: 50,
            model: "text-davinci-002",
            prompt: "Create an acronym with " + wordList + ": ",
          });
          var result = "";
          result = completion.data.choices[0].text;
          return {
            result,
          };
        } catch (error) {}
      }
    },
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
            apiKey: process.env.DREAMSTUDIO_API_KEY || "",
          });
          const castImage = stabilityImages as {
            res: unknown;
            images: [
              {
                buffer: any[];
                filePath: string;
                seed: number;
                mimeType: string;
              }
            ];
          };
          const path = require("path");
          const path1 = castImage.images[0].filePath;
          const filename = path.parse(path1).base;

          //move image path to public folder
          const fs = require("fs");
          const path3 = require("path");
          const oldPath = path1;
          const newPath = path3.join("./public/" + filename);
          fs.copyFile(oldPath, newPath, function (err: any) {
            if (err) throw err;
          });
          return {
            filename,
          };
        } catch (error) {}
      }
    },
  })
  .mutation("story", {
    input: z.object({
      description: z.string(),
    }),
    async resolve({ ctx: { session }, input }) {
      const { Configuration, OpenAIApi } = require("openai");
      const wordList = input.description;

      if (session?.user?.id) {
        try {
          const { Configuration, OpenAIApi } = require("openai");

          const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);
          const completion = await openai.createCompletion({
            max_tokens: 500,
            model: "text-davinci-002",
            //prompt: "Create an story to remember the words " + wordList + ": ",
            prompt: "Create rhyme that contains the words " + wordList + ": ",
          });

          var result = "";
          result = completion.data.choices[0].text;
          return {
            result,
          };
        } catch (error) {}
      }
    },
  })
  .mutation("prompt", {
    input: z.object({
      description: z.string(),
    }),
    async resolve({ ctx: { session }, input }) {
      const { Configuration, OpenAIApi } = require("openai");
      const wordList = input.description;

      if (session?.user?.id) {
        try {
          const { Configuration, OpenAIApi } = require("openai");

          const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);
          const completion = await openai.createCompletion({
            max_tokens: 500,
            model: "text-davinci-002",
            //prompt: "Create an story to remember the words " + wordList + ": ",
            prompt:
              "Describe an image that helps remember this: " +
              wordList.toUpperCase() +
              ": ",
          });

          var result = "";
          result = completion.data.choices[0].text;
          return {
            result,
          };
        } catch (error) {}
      }
    },
  });
