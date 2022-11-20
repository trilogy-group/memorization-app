import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createRouter } from "./context";

export const acronymRecommendationRouter = createRouter()
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
            var result = ""
            result = completion.data.choices[0].text
            return {
              result
            }
          } catch (error) {
          }
        }
      },
  });
  
  