import superjson from "superjson";

import { commentRouter } from "./comment";
import { createRouter } from "./context";
import { followRouter } from "./follow";
import { likeRouter } from "./like";
import { postRouter } from "./post";
import { progressRouter } from "./progress";
import { imgRecommendationRouter } from "./recommendImg";
import { acronymRecommendationRouter } from "./recommendAcro";
import { storyRecommendationRouter } from "./recommendStory";
import { notificationRouter } from "./notification";
import { contentTreeRouter } from "./contentTree";
import { userRouter } from "./user";
import { moderationRouter } from "./moderation";

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
