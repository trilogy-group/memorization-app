import superjson from "superjson";

import { commentRouter } from "./comment";
import { createRouter } from "./context";
import { followRouter } from "./follow";
import { likeRouter } from "./like";
import { postRouter } from "./post";
import { progressRouter } from "./progress";
import { recommendationRouter } from "./recommendations";
import { notificationRouter } from "./notification";
import { contentTreeRouter } from "./contentTree";
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
  .merge("recommendations.", recommendationRouter)
  .merge("getContentTree.", contentTreeRouter);

export type AppRouter = typeof appRouter;
