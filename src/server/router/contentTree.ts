import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

import { Convert, ContentTree } from "./contentTreeInterface";
//
//   const contentTree = Convert.toContentTree(json);

export const contentTreeRouter = createRouter()
  .middleware(async ({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("contentTree", {
    input: z.object({
      description: z.string(),
    }),
    
    async resolve({ ctx: { session }, input }) {
      const apiKey = process.env.CURRICULUM_GRAPH_API_KEY || "";
      const apiUrl = process.env.CURRICULUM_GRAPH_API_URL || "";
      if (session?.user?.id) {
        try {
           
          const data = await fetch(
            apiUrl,
            {
              method: "POST",
              headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query:
                  "query domains($subjectId: String, $domainId: String) {\r\n  domains(subjectId: $subjectId, domainId: $domainId) {\r\n    id\r\n    name\r\n    skills {\r\n        id\r\n        name\r\n        concepts {\r\n            id\r\n            name\r\n            questions {\r\n                id\r\n                desc\r\n                type\r\n                options {\r\n                    id\r\n                    desc\r\n                    ordinal\r\n                    is_correct\r\n                }\r\n            }\r\n        }\r\n    }\r\n  }\r\n}",
                variables: {
                  subjectId: "SUB2",
                },
              }),
            }
          )
            .catch((e) => {
              console.log(e);
            })
            .then((res) =>
              res?.json?.().then((data: ContentTree) => {
                return data;
              })
            );
        return data
        } catch (error) {console.log(error)}
      }
    },
  });
