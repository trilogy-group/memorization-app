import { useRouter } from "next/router";
import { FC, useEffect, useRef } from "react";
import { InView } from "react-intersection-observer";

import { trpc } from "@/utils/trpc";
import PostSection from "./PostSection";
import { useMutation } from "react-query";

import QuizMicro from "@/pages/quizMicro";
import { Post, Progress, Quiz } from "@prisma/client";
import { IoTelescope } from "react-icons/io5";

interface MainProps {
  origin: string;
}

const Main: FC<MainProps> = ({ origin }) => {

  const maxNumberOfPostsWithoutQuiz = 6;

  var numberOfConsecutivePosts = 0;


  const router = useRouter();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } =
    trpc.useInfiniteQuery(
      [
        Boolean(Number(router.query.following))
          ? "post.for-you-with-quizzes"
          : "post.for-you-with-quizzes",
        {},
      ],
      {
        getNextPageParam: (lastPage) => lastPage.nextSkip,
      }
    );

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // https://stackoverflow.com/questions/59918942/how-to-get-all-entries-using-intersection-observer-api
    // Find the video which is most inside the viewport

    if (!window.IntersectionObserver) return;

    if (observer.current) observer.current.disconnect();

    let videoElements = Array.from(
      document.querySelectorAll("video")
    ) as HTMLVideoElement[];

    let quizElements = Array.from(
      document.querySelectorAll("div.microQuiz")
    ) as HTMLVideoElement[];

    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // @ts-ignore
          entry.target.intersectionRatio = entry.intersectionRatio;
        }
        const mostVisible = videoElements.reduce((prev, current) => {
          if (
            // @ts-ignore
            current.intersectionRatio > (prev ? prev.intersectionRatio : 0)
          ) {
            return current;
          } else {
            return prev;
          }
        }, null as HTMLVideoElement | null);

        const mostVisibleQuiz = quizElements.reduce((prev, current) => {
          if (
            // @ts-ignore
            current.intersectionRatio > (prev ? prev.intersectionRatio : 0)
          ) {
            return current;
          } else {
            return prev;
          }
        }, null as HTMLVideoElement | null);

        if (mostVisible && mostVisible.paused) mostVisible.play();

        if (mostVisibleQuiz) {
          const startButton = mostVisibleQuiz.querySelector("#startTimer") as HTMLElement | null
          if (startButton != null) {
            startButton.click();
          }
        }

        videoElements.forEach((item) => {
          if (item !== mostVisible && !item.paused) item.pause();

        });

        quizElements.forEach((item) => {
          if (item !== mostVisibleQuiz) {
          }
        });



      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    videoElements.forEach((item) => observer.current?.observe(item));
    quizElements.forEach((item) => observer.current?.observe(item));

    // eslint-disable-next-line
  }, [data?.pages.length, Boolean(Number(router.query.following))]);

  if (data?.pages.length === 0 || data?.pages[0]?.items.length === 0)
    return (
      <div className="flex-grow text-center my-4">There is no post or quiz yet</div>
    );


  function showQuiz(refetch: Function, quizzes: Quiz[], posts: Post[], progresses: Progress[], post: any, key: string, origin: string) {
    numberOfConsecutivePosts = 0;
    return <div key={post.id}>
      <h1 className="text-3xl font-bold text-center text-lime-600">QUIZ</h1>
      < QuizMicro
        refetch={refetch}
        quizzes={quizzes}
        posts={posts}
        progresses={progresses}
      />
      <PostSection
        post={post}
        key={key}
        refetch={refetch}
        origin={origin}
      />

    </div>

  }

  function showPost(post: any, key: string, refetch: any, origin: string) {
    numberOfConsecutivePosts++;
    console.log("called show post ", post.worthShowingQuizBeforeThePost);
    return <div key={post.id}>
      <PostSection
        post={post}
        key={key}
        refetch={refetch}
        origin={origin}
      /></div>
  }

  return (
    <div className="flex-grow">
      {data?.pages.map((page) =>
        page.items.map(
          (post) => ((numberOfConsecutivePosts > 1 && post.worthShowingQuizBeforeThePost)
            || (numberOfConsecutivePosts >= maxNumberOfPostsWithoutQuiz)
          ) ?
            showQuiz(refetch, page.quizzes, page.posts, page.progresses, post, post.id, origin)
            :
            showPost(post, post.id, refetch, origin)
        )


      )

      }


      {/* At the bottom to detect infinite scroll */}
      <InView
        fallbackInView
        onChange={(inView) => {
          if (inView && !isFetchingNextPage && hasNextPage) {
            fetchNextPage();
          }
        }}
        rootMargin="0px 0px 1500px 0px"
      >
        {({ ref }) => <div ref={ref} className="h-10"></div>}
      </InView>

      <div className="text-center text-amber-400"> <h1 className="text-5xl font-bold">You have reached the end of the feed</h1></div>


    </div>
  );
};

export default Main;
