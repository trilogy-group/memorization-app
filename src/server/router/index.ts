import superjson from "superjson";

import { commentRouter } from "./comment";
import { createRouter } from "./context";
import { followRouter } from "./follow";
import { likeRouter } from "./like";
import { questionRouter } from "./question";
import { progressRouter } from "./progress";
import { imgRecommendationRouter } from "./recommendImg";
import { acronymRecommendationRouter } from "./recommendAcro";
import { storyRecommendationRouter } from "./recommendStory";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("question.", questionRouter)
  .merge("like.", likeRouter)
  .merge("follow.", followRouter)
  .merge("comment.", commentRouter)
  .merge("progress.", progressRouter)
  .merge("recommendImg.", imgRecommendationRouter)
  .merge("recommendAcro.", acronymRecommendationRouter)
  .merge("recommendStory.", storyRecommendationRouter);

export type AppRouter = typeof appRouter;
