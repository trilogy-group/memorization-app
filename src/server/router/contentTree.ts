import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter } from "./context";

import { cacheData, cacheDataNoQ, ContentTree } from "@/utils/contentTreeInterface";
//
//   const contentTree = Convert.toContentTree(json);



async function fetchWithCache() {
  const apiKey = process.env.CURRICULUM_GRAPH_API_KEY || "";
  const apiUrl = process.env.CURRICULUM_GRAPH_API_URL || "";
  const value = cacheData.get(apiUrl);
  if (value) {
    console.log('already cached');
    return value;
  } else {
    console.log('not cached', value);
    const hours = 1;
    try {
      const data = await fetch(apiUrl, {
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
      })
      .catch((e) => {
          console.log(e);
        })
        .then((res) =>
          res?.json?.().then((data: ContentTree) => {
            return data;
          })
      );
      if (data === undefined) {
        throw new Error('Cannot fetch from ContentTree API');
      }
      cacheData.put(apiUrl, data, hours * 1000 * 60 * 60);
      return data;
    } catch (error) {
      console.log(error);
    }
  }
}

async function fetchWithCacheNoQ() {
  const apiKey = process.env.CURRICULUM_GRAPH_API_KEY || "";
  const apiUrl = process.env.CURRICULUM_GRAPH_API_URL || "";
  const hours = 1;
  const value = cacheDataNoQ.get('TreeNoQ');
  if (value) {
    return value;
  } else {
    try {
      const data = await fetch(apiUrl, {
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
      })
        .catch((e) => {
          console.log(e);
        })
        .then((res) =>
          res?.json?.().then((data: ContentTree) => {
            return data;
          })
        );
      if (data === undefined) {
        throw new Error('Cannot fetch from ContentTree API');
      }
      cacheDataNoQ.put('TreeNoQ', data, hours * 1000 * 60 * 60);
      return data;
    } catch (error) {
      console.log(error);
    }

  }
}

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
      if (session?.user?.id) {
        try {
          const data = await fetchWithCache();

          return data;
        } catch (error) {
          console.log(error);
        }
      }
    },
  })
  .mutation("contentTreeNoQ", {
    input: z.object({
      description: z.string(),
    }),

    async resolve({ ctx: { session }, input }) {
      // find questions where no post has been made
      const questionIds = await prisma?.quiz.findMany({
        where: {
          Post: { none: {} }
        },
        select: {
          idInConcept: true,
        }
      });

      if (session?.user?.id) {
        try {
          const data: ContentTree | undefined = await fetchWithCacheNoQ();
          if (data === undefined) {
            throw new Error('Failed to fetch content tree');
          }
          data.data.domains = data.data.domains.filter((domain) => {
            domain.skills = domain.skills.filter((skill) => {
              skill.concepts = skill.concepts.filter((concept) => {
                var numEmptyQuestions = 0;
                for (const question of concept.questions) {
                  if (questionIds?.find((q) => q.idInConcept === question.id)) {
                    // found question where there is no post
                    numEmptyQuestions += 1;
                  }
                }
                if (numEmptyQuestions === concept.questions.length) {
                  // all questions in concept are empty
                  // do not return concept
                }
                else {
                  // return concept
                  return concept;
                }
              });
              if (skill.concepts.length != 0)
                return skill;
            });
            if (domain.skills.length != 0)
              return domain;
          });
          return data;
        } catch (error) {
          console.log(error);
        }
      }
    },
  });
