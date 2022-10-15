import { useRouter } from "next/router";
import { FC, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { v4 } from 'uuid'
import { trpc } from "@/utils/trpc";

import PostSection from "./PostSection";
import { useMutation } from "react-query";
import { Post, Quiz } from "@prisma/client";
import { array } from "zod";
import QuizSection from "./QuizSection";
import { FeedPostType } from "@/utils/text";
//import { FeedItem } from "@/server/router/post";

interface MainProps {
  origin: string;
}




const Main: FC<MainProps> = ({ origin }) => {
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
  console.log('pages length', data?.pages.length);

  return (
    <div className="flex-grow"><>
      {
        data?.pages.map((page, idx) => {
          console.log('page', page);
          return <div key={idx}>{
            page.items.map(feedItem => {
              console.log('feedItem', feedItem);
              if (feedItem.type === 'Post') {
                return <PostSection
                  post={feedItem?.post as FeedPostType}
                  key={feedItem?.post?.id}
                  refetch={refetch}
                  origin={origin}
                />
              } else {
                return <QuizSection
                  quiz={feedItem.quizzes as Quiz[]}
                  refetch={refetch}
                  origin={origin}
                  //key={v4()}
                  key={feedItem?.quizzes[0]?.idInConcept as string}
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
