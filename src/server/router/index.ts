import superjson from "superjson";

import { commentRouter } from "./comment";
import { contentTreeRouter } from "./contentTree";
import { createRouter } from "./context";
import { followRouter } from "./follow";
import { likeRouter } from "./like";
import { moderationRouter } from "./moderation";
import { notificationRouter } from "./notification";
import { postRouter } from "./post";
import { progressRouter } from "./progress";
import { acronymRecommendationRouter } from "./recommendAcro";
import { imgRecommendationRouter } from "./recommendImg";
import { storyRecommendationRouter } from "./recommendStory";
import { userRouter } from "./user";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("user.", userRouter)
  .merge("post.", postRouter)
  .merge("like.", likeRouter)
  .merge("follow.", followRouter)
  .merge("comment.", commentRouter)
  .merge("progress.", progressRouter)
  .merge("notification.", notificationRouter)
  .merge("moderation.", moderationRouter)
  .merge("recommendImg.", imgRecommendationRouter)
  .merge("recommendAcro.", acronymRecommendationRouter)
  .merge("recommendStory.", storyRecommendationRouter)
  .merge("getContentTree.", contentTreeRouter);

export type AppRouter = typeof appRouter;
