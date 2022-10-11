import { useRouter } from "next/router";
import { FC, useEffect, useRef } from "react";
import { InView } from "react-intersection-observer";

import { trpc } from "@/utils/trpc";
import QuestionSection from "./QuestionSection";

import QuizMicro from "@/pages/quizMicro";


interface MainProps {
  origin: string;
}

const Main: FC<MainProps> = ({ origin }) => {
  const router = useRouter();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } =
    trpc.useInfiniteQuery(
      [
        Boolean(Number(router.query.following))
          ? "question.following"
          : "question.for-you",
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
          mostVisibleQuiz.querySelector("#startTimer")!.click();
          console.log("starting quiz");
        }

        videoElements.forEach((item) => {
          if (item !== mostVisible && !item.paused) item.pause();
        });

        quizElements.forEach((item) => {
          if (item !== mostVisibleQuiz) {

            console.log("pausing quiz");
          }
        });
        // My code for post timer begins

        // My code for post timer ends
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
      <div className="flex-grow text-center my-4">There is no question yet</div>
    );

  return (
    <div className="flex-grow">
      {data?.pages.map((page) =>
        page.items.map((question) => (
          <QuestionSection
            question={question}
            key={question.id}
            refetch={refetch}
            origin={origin}
          />
        ))
      )}

      <div>{
        <QuizMicro
          refetch={refetch}
        />

      }</div>


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

    </div>
  );
};

export default Main;
