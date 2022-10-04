import superjson from "superjson";

import { commentRouter } from "./comment";
import { createRouter } from "./context";
import { followRouter } from "./follow";
import { likeRouter } from "./like";
import { videoRouter } from "./video";
import { recommendationRouter } from "./recommendImg";
import { progressRouter } from "./progress";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("video.", videoRouter)
  .merge("like.", likeRouter)
  .merge("follow.", followRouter)
  .merge("comment.", commentRouter)
  .merge("recommend.", recommendationRouter)
  .merge("progress.", progressRouter);

export type AppRouter = typeof appRouter;
