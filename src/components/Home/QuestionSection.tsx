import { User, Video } from "@prisma/client";
import Image from "next/future/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { AiFillHeart, AiFillTwitterCircle } from "react-icons/ai";
import { BiLink } from "react-icons/bi";
import { BsFacebook, BsReddit } from "react-icons/bs";
import { FaCommentDots } from "react-icons/fa";
import { IoIosShareAlt } from "react-icons/io";

import { copyToClipboard } from "@/utils/clipboard";
import { formatNumber } from "@/utils/number";
import { formatAccountName } from "@/utils/text";
import { trpc } from "@/utils/trpc";

import VideoPlayer from "./VideoPlayer";

interface QuestionSectionProps {
  question: Video & {
    user: User;
    _count: {
      likes: number;
      comments: number;
    };
    likedByMe: boolean;
    followedByMe: boolean;
  };
  origin: string;
  refetch: Function;
}

const QuestionSection: FC<QuestionSectionProps> = ({ question, refetch, origin }) => {
  const session = useSession();

  const likeMutation = trpc.useMutation("like.toggle");
  const notificationMutation = trpc.useMutation("notification.createLike");
  const followMutation = trpc.useMutation("follow.toggle");

  const gotItMutation = trpc.useMutation("progress.post-got-it");

  const [isCurrentlyLiked, setIsCurrentlyLiked] = useState(question.likedByMe);
  const [isChosenToMemorize, setIsChosenToMemorize] = useState(false);
  const [isCurrentlyFollowed, setIsCurrentlyFollowed] = useState<
    undefined | boolean
  >(undefined);

  const videoURL = `${origin}/question/${question.id}`;

  const toggleLike = () => {
    if (!session.data?.user) {
      toast("You need to login");
    } else {
      try {
        if (!isCurrentlyLiked) {
          notificationMutation.mutateAsync({
            content: session.data.user.name + " liked your post ",
            questionId: question.id as string,
            userId: question.user.id as string,
          });
        }
      } catch {
        throw new Error("Cannot update notifications");
      }

      likeMutation
        .mutateAsync({
          isLiked: !isCurrentlyLiked,
          questionId: question.id,
        })
        .then(() => {
          refetch();
        })
        .catch((err) => {
          console.log(err);
          setIsCurrentlyLiked(isCurrentlyLiked);
        });
      setIsCurrentlyLiked(!isCurrentlyLiked);
    }
  };

  const toggleFollow = () => {
    if (!session.data?.user) {
      toast("You need to log in");
      return;
    }
    followMutation
      .mutateAsync({
        followingId: question.userId,
        isFollowed:
          typeof isCurrentlyFollowed === "undefined"
            ? !question.followedByMe
            : !isCurrentlyFollowed,
      })
      .then(() => {
        refetch();
      })
      .catch((err) => {
        console.log(err);
        setIsCurrentlyFollowed(isCurrentlyFollowed);
      });
    setIsCurrentlyFollowed(
      typeof isCurrentlyFollowed === "undefined"
        ? !question.followedByMe
        : !isCurrentlyFollowed
    );
  };


  const toggleGotIt = () => {
    if (!session.data?.user) {
      toast("You need to login");
    } else {
      gotItMutation
        .mutateAsync({
          questionId: question.id,
        })
        .then(() => {
          refetch();
        })
        .catch((err) => {
          console.log(err);
        });

      setIsChosenToMemorize(!isChosenToMemorize);
    }
  };

  return (
    <div key={question.id} className="flex items-start p-2 lg:p-4 gap-3">
      <Link href={`/user/${question.user.id}`}>
        <a className="flex-shrink-0 rounded-full">
          <Image
            width={60}
            height={60}
            src={question.user.image!}
            className="rounded-full w-[30px] h-[30px] lg:w-[60px] lg:h-[60px]"
            alt=""
          />
        </a>
      </Link>
      <div className="flex flex-col items-stretch gap-3 flex-grow">
        <div className="flex">
          <div className="flex-grow">
            <Link href={`/user/${question.user.id}`}>
              <a className="font-bold hover:underline mr-1">
                {formatAccountName(question.user.name!)}
              </a>
            </Link>
            <Link href={`/user/${question.user.id}`}>
              <a className="text-sm hover:underline">{question.user.name}</a>
            </Link>
            <p style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
              {question.caption}
            </p>
          </div>
          {/* @ts-ignore */}
          {question.userId !== session.data?.user?.id && (
            <div className="flex-shrink-0">
              <button
                onClick={() => toggleFollow()}
                className={`py-1 px-3 rounded text-sm mt-2 ${isCurrentlyFollowed ?? question.followedByMe
                  ? "border hover:bg-[#F8F8F8] transition"
                  : "border border-pink text-pink hover:bg-[#FFF4F5] transition"
                  }`}
              >
                {isCurrentlyFollowed ?? question.followedByMe
                  ? "Following"
                  : "Follow"}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-end gap-5">
          <Link href={`/question/${question.id}`}>
            <a
              className={`${question.videoHeight > question.videoWidth * 1.3
                ? "md:h-[600px]"
                : "flex-grow h-auto"
                } block bg-[#3D3C3D] rounded-md overflow-hidden flex-grow h-auto md:flex-grow-0`}
            >
              <VideoPlayer
                src={question.videoURL}
                poster={question.coverURL}
              ></VideoPlayer>
            </a>
          </Link>
          <div className="flex flex-col gap-1 lg:gap-2">
            <button
              onClick={() => toggleLike()}
              className="lg:w-12 lg:h-12 w-7 h-7 bg-[#F1F1F2] fill-black flex justify-center items-center rounded-full"
            >
              <AiFillHeart
                className={`lg:w-7 lg:h-7 h-5 w-5 ${isCurrentlyLiked ? "fill-pink" : ""
                  }`}
              />
            </button>
            <p className="text-center text-xs font-semibold">
              {formatNumber(question._count.likes)}
            </p>
            <Link href={`/question/${question.id}`}>
              <a className="lg:w-12 lg:h-12 w-7 h-7 bg-[#F1F1F2] fill-black flex justify-center items-center rounded-full">
                <FaCommentDots className="lg:w-6 lg:h-6 h-4 w-4 scale-x-[-1]" />
              </a>
            </Link>
            <p className="text-center text-xs font-semibold">
              {formatNumber(question._count.comments)}
            </p>
            <div className="relative group">
              <button className="lg:w-12 lg:h-12 w-7 h-7 bg-[#F1F1F2] fill-black flex justify-center items-center rounded-full">
                <IoIosShareAlt className="lg:w-8 lg:h-8 w-6 h-6" />
              </button>
              <div className="absolute bottom-[100%] right-0 rounded-md py-2 flex flex-col items-stretch bg-white border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <a
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 transition"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    videoURL
                  )}&t=${encodeURIComponent(`${question.user.name} on EdTok`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BsFacebook className="fill-[#0476E9] w-7 h-7" />
                  <span className="whitespace-nowrap">Share to Facebook</span>
                </a>
                <a
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 transition"
                  href={`http://twitter.com/share?text=${encodeURIComponent(
                    `${question.user.name} on EdTok`
                  )}&url=${encodeURIComponent(videoURL)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AiFillTwitterCircle className="fill-[#05AAF4] w-8 h-8 mx-[-2px]" />
                  <span className="whitespace-nowrap">Share to Twitter</span>
                </a>
                <a
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 transition"
                  href={`http://www.reddit.com/submit?url=${encodeURIComponent(
                    videoURL
                  )}&title=${encodeURIComponent(
                    `${question.user.name} on EdTok`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BsReddit className="fill-[#FF4500] w-7 h-7" />
                  <span className="whitespace-nowrap">Share to Reddit</span>
                </a>
                <button
                  onClick={() => {
                    copyToClipboard(videoURL)
                      ?.then(() => toast("Copied to clipboard"))
                      ?.catch(() => toast.error("Failed to copy to clipboard"));
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 transition"
                >
                  <span className="w-7 h-7 flex justify-center items-center bg-[#FE2C55] rounded-full">
                    <BiLink className="fill-white w-5 h-5" />
                  </span>
                  <span className="whitespace-nowrap">Copy Link</span>
                </button>
              </div>
            </div>
            <button className={`lg:w-12 lg:h-12 w-7 h-7 fill-black rounded-full ${isChosenToMemorize ? "bg-[#11ab30]" : "bg-[#de2814]"
              }`} onClick={() => { toast("You chose to memorize this post"); toggleGotIt(); }}>
              <img src="/memorizeThatIcon.png"></img>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};




export default QuestionSection;
