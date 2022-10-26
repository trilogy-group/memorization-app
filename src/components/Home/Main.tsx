import { useRouter } from "next/router";
import { Dispatch, FC, SetStateAction, useState, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { trpc } from "@/utils/trpc";

import PostSection from "./PostSection";
import { Quiz } from "@prisma/client";
import QuizSection from "./QuizSection";
import { FeedPostType } from "@/utils/text";

interface MainProps {
  origin: string;
  triggerRefetch: boolean,
  onTriggerRefetchChange: Dispatch<SetStateAction<boolean>>,
}

const Main: FC<MainProps> = ({ origin, triggerRefetch, onTriggerRefetchChange }) => {
  const router = useRouter();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } =
    trpc.useInfiniteQuery(
      [
        "post.for-you",
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

        if (mostVisible && mostVisible.paused) mostVisible.play();

        videoElements.forEach((item) => {
          if (item !== mostVisible && !item.paused) item.pause();
        });
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    videoElements.forEach((item) => observer.current?.observe(item));

    // eslint-disable-next-line
  }, [data?.pages.length, Boolean(Number(router.query.following))]);

  let { ref, inView } = useInView({
  });

  useEffect(() => {
    if (inView && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [inView])

  useEffect(() => {
    router.push('/', undefined, { shallow: false });
  }, [triggerRefetch])

  // refresh every 30s when post has reached the end and there is no pending quiz
  if (data?.pages[0]?.items[0]?.type === 'Quiz' && data?.pages[0]?.items[0]?.quizzes?.length == 0) {
  //  setTimeout(function () { router.push('/'); }, 30000);
  }

  return (
    <div className="flex-grow"><>
      {
        data?.pages.map((page, idx) => {
          return <div key={idx}>{
            page.items.map((feedItem, feedIdx) => {
              if (feedItem.type === 'Post') {
                return <PostSection
                  post={feedItem?.post as FeedPostType}
                  key={feedIdx}
                  refetch={refetch}
                  origin={origin}
                  triggerRefetch={triggerRefetch}
                  onTriggerRefetchChange={onTriggerRefetchChange}
                />
              } else {
                if (!feedItem?.quizzes || feedItem?.quizzes.length == 0)
                  return <></>
                return <QuizSection
                  quiz={feedItem.quizzes as Quiz[]}
                  refetch={refetch}
                  origin={origin}
                  key={feedIdx}
                  triggerRefetch={triggerRefetch}
                  onTriggerRefetchChange={onTriggerRefetchChange}
                />
              }
            })
          }</div>
        })
      }

      {/* At the bottom to detect infinite scroll */}
      <div ref={ref}></div></>
    </div>
  );
};

export default Main;
