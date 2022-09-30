import type { GetServerSideProps, NextPage } from "next";
import { Textarea } from '@nextui-org/react';

import { useRouter } from "next/router";
import Link from "next/link";
import { AiOutlinePlus } from "react-icons/ai";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

const CreateListOfWords: NextPage = () => {
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [selectedMnemonics, setSelectedMnemonics] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);

  const handleGenerate = async () => {
    // TODO: connect to backend generate mnemonics API
  }

  const handleUpload = async () => {
    if (
      !inputValue.trim() ||
      isLoading
    )
      return;
    setIsLoading(true);
    const toastID = toast.loading("Posting...");
    try {

      toast.loading("Mnemonics Created! Points +1", { id: toastID });
      await new Promise(r => setTimeout(r, 800));
      toast.dismiss(toastID);
      setIsLoading(false);
      //router.push(`/video/${created.id}`);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      toast.error("Failed to upload video", {
        position: "bottom-right",
        id: toastID,
      });
    }
  };

  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-2xl font-bold">Memorize a list of words</h1>

            <div className="flex items-start mt-10 gap-4">
              <div className="flex-grow">
                <Textarea
                  label="Enter your question"
                  placeholder="e.g., world leaders during WW2"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                  }}
                />

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-start mt-10 gap-4">
                    <button
                      disabled={isLoading}
                      onClick={() => {
                        setIsLoading(true);
                        async () => await handleGenerate();
                        setIsLoading(false);
                      }}
                      className="border rounded flex py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
                    >
                      Generate Mnemonics
                    </button>
                  </div>
                </div>

                <div className="p-2 border border-gray-2 h-[170px] mb-2">
                  {coverImageURL ? (
                    <img
                      className="h-full w-auto object-contain"
                      src={coverImageURL}
                      alt=""
                    />
                  ) : (
                    <div className="bg-gray-1 h-full w-[100px]"></div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <p className="text-2xl font-bold">I want to upload my own</p>
                  <div className="flex items-start mt-10 gap-4">
                    <Link href={"/upload"}>
                      <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                        <AiOutlinePlus className="w-5 h-5" />
                        <span>Videos</span>
                      </a>
                    </Link>
                  </div>
                </div>
                <button
                  onClick={async () => await handleUpload()}
                  disabled={
                    !inputValue.trim() ||
                    isLoading
                  }
                  className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                >
                  {isLoading && (
                    <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                  )}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateListOfWords;

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
