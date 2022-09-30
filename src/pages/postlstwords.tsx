import type { GetServerSideProps, NextPage } from "next";
import { Textarea } from '@nextui-org/react';

import { useRouter } from "next/router";
import Link from "next/link";
import { AiOutlinePlus } from "react-icons/ai";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { fetchWithProgress } from "@/utils/fetch";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";

const CreateListOfWords: NextPage = () => {
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
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
                  label="Write your thoughts"
                  placeholder="Enter your amazing ideas."
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
                    <Link href={"/upload"}>
                      <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                        <AiOutlinePlus className="w-5 h-5" />
                        <span>Images</span>
                      </a>
                    </Link>
                    <Link href={"/upload"}>
                      <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                        <AiOutlinePlus className="w-5 h-5" />
                        <span>Texts</span>
                      </a>
                    </Link>
                  </div>
                </div>
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
