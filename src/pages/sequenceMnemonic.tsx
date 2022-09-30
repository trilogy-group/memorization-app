import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { DragEventHandler, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BsFillCloudUploadFill } from "react-icons/bs";

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { fetchWithProgress } from "@/utils/fetch";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";
import ReactDOM from "react-dom";
import Link from "next/link";



const SequenceMnemonic: NextPage = () => {
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

    const script = document.createElement('script');

    script.src = "https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js";
    script.async = true;

    document.body.appendChild(script);
    console.log("added da script");

    setTimeout(() => {
      let quizScript = document.createElement('script');

      quizScript.innerHTML = "new Sortable(quiz);"

      document.body.appendChild(quizScript);
    }, 300);



    return () => {
      document.body.removeChild(script);
      console.log("sdfdsfsdf");
    }

  }, [uploadMutation.error]);

  const handleGenerate = async () => {
    // TODO: connect to backend generate mnemonics API
    console.log("something something");
  };

  const addToSequence = async () => {
    console.log("adding entry");
    var entry = document.createElement("li");
    /*
          var h = React.createElement(
            "h1",
            { className: "text-2xl font-bold" },
            "I'm suggesting you this mnemonic text"
          )
    */
    entry.innerHTML = inputValue.trim();
    document.getElementById("quiz").appendChild(entry);
  };

  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-2xl font-bold">Memorize a sequence</h1>
            <ul id="quiz">
              <li>1</li>
              <li>2</li>
              <li>5</li>
              <li>3</li>
              <li>4</li>
              <li>6</li>
            </ul>
            <input
              type="text"
              id="newEntry"
              className="p-2 w-full border border-gray-2 mt-1 mb-3 outline-none focus:border-gray-400 transition"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
            />

            <button
              onClick={async () => await addToSequence()}

              className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
            >

              Add entry
            </button>
            <div className="flex items-start mt-10 gap-4">
              <div className="flex-grow">


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
                        <span>Upload file by myself</span>
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

export default SequenceMnemonic;

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
