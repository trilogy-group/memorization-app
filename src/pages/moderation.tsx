import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useState } from "react";
import toast from "react-hot-toast";
import { trpc } from "@/utils/trpc";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { authOptions } from "./api/auth/[...nextauth]";

const Moderation: NextPage = () => {
  const isModeratorMutation = trpc.useMutation("moderation.isModerator");
  const removeMutation = trpc.useMutation("moderation.remove");
  const [postId, setPostId] = useState<string | null>(null);

  const handleRemovePost = () => {
    isModeratorMutation.mutateAsync(postId as string).then((res) => {
      if (res === null) {
        toast.error("Not an admin, no privilege to remove posts", {
          position: "bottom-right",
        });
        return null;
      }
    });
    removeMutation.mutateAsync({postId: postId as string}).then((res) => {
      if (res === null) {
        toast.error("Post removal failed", {
          position: "bottom-right",
        });
        return null;
      }
      else {
        toast.loading("Post removed");
      }
    });
  };

  return (
    <>
      <Meta title="Log in | EdTok" description="Log in" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex-grow flex flex-col justify-center items-center gap-3">
          <p className="text-center w-[95vw] max-w-[375px] text-sm text-gray-500">
            Enter Post Id to remove
          </p>
          <input
            type="text"
            id="caption"
            className="p-2 border border-gray-2 mt-1 mb-3 outline-none focus:border-gray-400 transition"
            value={postId as string}
            onChange={(e) => setPostId(e.target.value)}
          />
          <button
            onClick={() => handleRemovePost()}
            className="w-[95vw] max-w-[375px] flex justify-center items-center relative border border-gray-200 hover:border-gray-400 transition h-11"
            disabled={postId === null}
          >
            <span>Remove</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Moderation;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: true,
      },
      props: {},
    };
  }

  return {
    props: {
      session,
    },
  };
};
