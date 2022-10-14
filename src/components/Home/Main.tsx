import { useRouter } from "next/router";
import { FC, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";

import { trpc } from "@/utils/trpc";

import PostSection from "./PostSection";
import { useMutation } from "react-query";

interface MainProps {
  origin: string;
}

const Main: FC<MainProps> = ({ origin }) => {
  const router = useRouter();

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, refetch } =
    trpc.useInfiniteQuery(
      [
        Boolean(Number(router.query.following))
          ? "post.following"
          : "post.for-you",
        {},
      ],
      {
        getNextPageParam: (lastPage) => lastPage.nextSkip,
      }
    );
  const quizMutation = useMutation("progress.get-one-quiz");
  // null check

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



  if (data?.pages.length === 0 || data?.pages[0]?.items.length === 0)
    return (
      <div className="flex-grow text-center my-4">There is no post yet</div>
    );

  let { ref, inView } = useInView({
    /* Optional options */
    threshold: 0,
  });

  useEffect(() => {
    if (inView && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  }, [inView])


  return (
    <div className="flex-grow">
      {data?.pages.map((page) =>
        page.items.map((post) => (
          <PostSection
            post={post}
            key={post.id}
            refetch={refetch}
            origin={origin}
          />
        ))
      )}

      {/* At the bottom to detect infinite scroll */}
      <div ref={ref}></div>
    </div>
  );
};

export default Main;
