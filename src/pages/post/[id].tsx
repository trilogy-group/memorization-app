import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Image from "next/future/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { FormEvent, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiFillHeart, AiFillTwitterCircle } from "react-icons/ai";
import { BsFacebook, BsReddit } from "react-icons/bs";
import { FaCommentDots, FaTimes } from "react-icons/fa";

import Meta from "@/components/Shared/Meta";
import { VolumeContext } from "@/context/VolumeContext";
import { prisma } from "@/server/db/client";
import { copyToClipboard } from "@/utils/clipboard";
import { formatNumber } from "@/utils/number";
import { formatAccountName } from "@/utils/text";
import { trpc } from "@/utils/trpc";

import { authOptions } from "../api/auth/[...nextauth]";

const Post: NextPage<PostProps> = ({ post, href, title }) => {
  const session = useSession();
  const router = useRouter();

  const [isBackButtonVisible, setIsBackButtonVisible] = useState(false);

  const likeCountQuery = trpc.useQuery(
    ["like.count", { postId: post?.id! }],
    { initialData: { count: post?._count.likes! } }
  );
  const commentsQuery = trpc.useQuery(
    ["comment.by-post", { postID: post?.id! }],
    { initialData: post?.comments! }
  );
  const likeMutation = trpc.useMutation("like.toggle");
  const followMutation = trpc.useMutation("follow.toggle");
  const postCommentMutation = trpc.useMutation("comment.post");
  const notificationMutation = trpc.useMutation("notification.createComment");

  const [isCurrentlyLiked, setIsCurrentlyLiked] = useState(post?.likedByMe);
  const [isCurrentlyFollowed, setIsCurrentlyFollowed] = useState(
    post?.followedByMe
  );
  const [inputValue, setInputValue] = useState("");
  const { isMuted, setIsMuted } = useContext(VolumeContext);

  useEffect(() => {
    if (history.length > 2) setIsBackButtonVisible(true);
  }, []);

  const toggleLike = () => {
    if (!session.data?.user) {
      toast("You need to login");
    } else {
      likeMutation
        .mutateAsync({
          isLiked: !isCurrentlyLiked,
          postId: post?.id!,
        })
        .then(() => {
          likeCountQuery.refetch();
        })
        .catch((err) => {
          console.log(err);
        });
      setIsCurrentlyLiked(!isCurrentlyLiked);
    }
  };

  const toggleFollow = () => {
    if (!session.data?.user) {
      toast("You need to log in");
      return;
    }
    followMutation.mutateAsync({
      followingId: post?.user.id!,
      isFollowed: !isCurrentlyFollowed,
    });
    setIsCurrentlyFollowed(!isCurrentlyFollowed);
  };

  const handlePostComment = (e: FormEvent) => {
    e.preventDefault();

    if (postCommentMutation.isLoading || !inputValue.trim()) return;

    setInputValue("");

    postCommentMutation
      .mutateAsync({
        content: inputValue.trim(),
        postId: post?.id!,
      })
      .then(() => {
        commentsQuery.refetch();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Post comment failed");
      });
    try {
      notificationMutation.mutateAsync({
        content: session.data?.user?.name + " commented your post " + "\"" + inputValue.trim() + "\"",
        postId: post?.id as string,
        userId: post?.user.id as string,
      });
    } catch {
      throw new Error("Cannot update notifications");
    }


  };

  if (!post) return <></>;

  return (
    <>
      <Meta
        title={`${post.user.name} on EdTok`}
        description="Video | EdTok"
        image={post.coverURL}
      />

      <div className="flex flex-col lg:flex-row lg:h-screen items-stretch">
        <div className="lg:flex-grow flex justify-center items-center relative bg-[#1E1619]">
          <video
            className="w-auto h-auto max-w-full max-h-[600px] lg:max-h-full"
            src={post.videoURL}
            muted={isMuted}
            onVolumeChange={(e: any) => setIsMuted(e.target.muted)}
            autoPlay
            loop
            poster={post.coverURL}
            controls
            playsInline
          ></video>
          <div className="absolute top-5 left-5 flex gap-3">
            {isBackButtonVisible && (
              <button
                onClick={() => router.push("/")}
                className="bg-[#3D3C3D] w-[40px] h-[40px] rounded-full flex justify-center items-center"
              >
                <FaTimes className="w-5 h-5 fill-white" />
              </button>
            )}
            <Link href="/">
              <a className="w-[40px] h-[40px]">
                <img
                  className="w-full h-full object-cover rounded-full"
                  src="/favicon.png"
                  alt=""
                />
              </a>
            </Link>
          </div>
        </div>
        <div className="w-full lg:w-[500px] flex-shrink-0 flex flex-col items-stretch h-screen">
          <div className="px-4 pt-6 pb-4 flex-shrink-0 border-b">
            <div className="flex">
              <Link href={`/user/${post.user.id}`}>
                <a className="mr-3 flex-shrink-0 rounded-full">
                  <Image
                    src={post.user.image!}
                    alt=""
                    height={40}
                    width={40}
                    className="rounded-full"
                  />
                </a>
              </Link>
              <div className="flex-grow">
                <Link href={`/user/${post.user.id}`}>
                  <a className="font-bold block hover:underline">
                    {formatAccountName(post.user.name!)}
                  </a>
                </Link>
                <Link href={`/user/${post.user.id}`}>
                  <a className="text-sm block hover:underline">
                    {post.user.name}
                  </a>
                </Link>
              </div>
              {/* @ts-ignore */}
              {post.user.id !== session.data?.user?.id && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => toggleFollow()}
                    className={`py-1 px-3 rounded text-sm mt-2 ${isCurrentlyFollowed ?? post.followedByMe
                        ? "border hover:bg-[#F8F8F8] transition"
                        : "border border-pink text-pink hover:bg-[#FFF4F5] transition"
                      }`}
                  >
                    {isCurrentlyFollowed ?? post.followedByMe
                      ? "Following"
                      : "Follow"}
                  </button>
                </div>
              )}
            </div>
            <p
              className="my-3"
              style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
            >
              {post.caption}
            </p>

            <div className="flex justify-between items-center">
              <div className="flex gap-5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleLike()}
                    className="w-9 h-9 bg-[#F1F1F2] fill-black flex justify-center items-center rounded-full"
                  >
                    <AiFillHeart
                      className={`w-5 h-5 ${isCurrentlyLiked ? "fill-pink" : ""
                        }`}
                    />
                  </button>
                  <span className="text-center text-xs font-semibold">
                    {formatNumber(likeCountQuery.data?.count!)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 bg-[#F1F1F2] fill-black flex justify-center items-center rounded-full">
                    <FaCommentDots className="w-5 h-5 scale-x-[-1]" />
                  </button>
                  <p className="text-center text-xs font-semibold">
                    {formatNumber(commentsQuery.data?.length || 0)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    href
                  )}&t=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BsFacebook className="fill-[#0476E9] w-7 h-7" />
                </a>
                <a
                  href={`http://twitter.com/share?text=${encodeURIComponent(
                    title
                  )}&url=${encodeURIComponent(href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <AiFillTwitterCircle className="fill-[#05AAF4] w-8 h-8" />
                </a>
                <a
                  href={`http://www.reddit.com/submit?url=${encodeURIComponent(
                    href
                  )}&title=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BsReddit className="fill-[#FF4500] w-7 h-7" />
                </a>
              </div>
            </div>

            <div className="flex items-stretch mt-3">
              <input
                // @ts-ignore
                onClick={(e) => e.target?.select?.()}
                className="bg-[#F1F1F2] p-2 flex-grow text-sm border outline-none"
                readOnly
                type="text"
                value={href}
              />
              <button
                className="flex-shrink-0 border px-2"
                onClick={() => {
                  copyToClipboard(href)
                    ?.then(() => toast("Copied to clipboard"))
                    ?.catch(() => toast.error("Failed to copy to clipboard"));
                }}
              >
                Copy link
              </button>
            </div>
          </div>
          <div className="flex-grow flex flex-col items-stretch gap-3 overflow-y-auto bg-[#F8F8F8] p-5">
            {commentsQuery.data?.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Link href={`/user/${comment.user.id}`}>
                  <a className="flex-shrink-0 rounded-full">
                    <Image
                      src={comment.user.image!}
                      width={40}
                      height={40}
                      className="rounded-full"
                      alt=""
                    />
                  </a>
                </Link>
                <div className="flex-grow">
                  <Link href={`/user/${comment.user.id}`}>
                    <a className="font-bold hover:underline">
                      {comment.user.name}
                    </a>
                  </Link>
                  <p
                    style={{
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {comment.content}
                  </p>
                  <p className="text-sm text-gray-400">
                    {comment.createdAt.toLocaleDateString("vi")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={handlePostComment}
            className="flex-shrink-0 flex p-5 gap-3 border-t"
          >
            <input
              className="bg-[#F1F1F2] rounded-md p-2 flex-grow text-sm outline-none placeholder:text-gray-500 border border-transparent focus:border-gray-300 transition"
              type="text"
              placeholder="Add comment..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              disabled={postCommentMutation.isLoading || !inputValue.trim() || !session?.data?.user}
              type="submit"
              className={`transition ${postCommentMutation.isLoading || !inputValue.trim()
                  ? ""
                  : "text-pink"
                }`}
            >
              {postCommentMutation.isLoading ? "Posting..." : "Post"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Post;

type PostProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export const getServerSideProps = async ({
  params,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = (await getServerSession(req, res, authOptions)) as any;
  try {
    const id = params?.id as string;

    if (!id) throw new Error();

    const post = await prisma.post.findFirstOrThrow({
      where: { id },
      select: {
        id: true,
        videoURL: true,
        coverURL: true,
        caption: true,
        _count: { select: { likes: true } },
        user: { select: { id: true, image: true, name: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: { select: { id: true, image: true, name: true } },
          },
        },
      },
    });
    let likedByMe = false;
    let followedByMe = false;

    if (session?.user?.id) {
      let [likeObj, followObj] = await Promise.all([
        prisma.like.findFirst({
          where: {
            userId: session?.user?.id,
            postId: post.id,
          },
        }),
        prisma.follow.findFirst({
          where: {
            followerId: session.user.id,
            followingId: post.user.id,
          },
        }),
      ]);
      likedByMe = Boolean(likeObj);
      followedByMe = Boolean(followObj);
    }

    return {
      props: {
        post: {
          ...post,
          likedByMe,
          followedByMe,
        },
        session,
        href: `${req.headers.host?.includes("localhost") ? "http" : "https"
          }://${req.headers.host}/post/${id}`,
        title: `${post.user.name} on EdTok`,
      },
    };
  } catch (error) {
    return {
      props: {},
      notFound: true,
    };
  }
};
