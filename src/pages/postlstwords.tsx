import type { GetServerSideProps, NextPage } from "next";
import { Textarea } from '@nextui-org/react';
import Link from "next/link";

import { AiOutlinePlus } from "react-icons/ai";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import { borderRadius } from "@mui/system";
import { getSystemErrorMap } from "util";

const wordList: string[] = [];


const CreateListOfWords: NextPage = () => {

  const uploadMutation = trpc.useMutation("video.create");


  // TODO: connect mnemonic image with recommendation system in the backend
  const [mnemonicImage, setMnemonicImage] = useState<string | undefined>(undefined);
  const [acronym, setAcronym] = useState<string | undefined>(undefined);


  const imgRecommendationMutation = trpc.useMutation("recommendImg.stabledif");
  const acroRecommendationMutation = trpc.useMutation("recommendAcro.acronym");


  const [inputValue, setInputValue] = useState("");
  const [inputPromptValue, setInputPromptValue] = useState("");
  const [inputQuestionValue, setInputQuestionValue] = useState("");

  const [tableEntryValue, setTableEntryValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);


  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);

  const handleRecommeddedImage = async () => {
    const created = await imgRecommendationMutation.mutateAsync({
        description: inputPromptValue,
      });
    setMnemonicImage(created?.filename);
  }

  const handleRecommeddedAcronym = async () => {
    var acronymLeters = "";
    
    //Get first leter for each word in wordList
    
    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        const arrayOfLeters = wordList[i]?.split("");
        if (arrayOfLeters != undefined) {
          acronymLeters += arrayOfLeters[0];
        }
      }
    acronymLeters = acronymLeters.toUpperCase();
    }
    const acronymCreated = await acroRecommendationMutation.mutateAsync({
        description: acronymLeters,
      });
    setAcronym("Remember " + acronymLeters + " with: " + acronymCreated?.result);
  }

  const handleUpload = async () => {
    // TODO: connect to the mnemonics generation backend
  };

  const handleAddToSequence = async () => {
    var entry = document.createElement("li");
    entry.innerHTML = tableEntryValue.trim();
    entry.className = "border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition";
    const answer = document.getElementById("answer");
    if (answer != null) {
      answer.appendChild(entry);
      wordList.push(tableEntryValue);
    } else {
      throw new Error("Missing element 'answer' table");
    }
  };


  // TODO: connect list of words answer with the curricular graph
  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow place-items-center">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-2xl font-bold">Memorize a list of words</h1>
            <div className="flex items-start mt-10 gap-4">
              <div className="grid grid-cols-2 gap-11 p-2 w-[100%] h-[75%] mt-5 mb-2">
                <div className="col-span-1 h-full w-full">
                  <div className="grid grid-cols-2 gap-1">
                    <Textarea
                      label="Enter your question"
                      placeholder="e.g., world leaders during WW2"
                      value={inputQuestionValue}
                      onChange={(e) => {
                        setInputQuestionValue(e.target.value);
                      }}
                    />
                    <Textarea
                      label="Give prompts for the generation"
                      placeholder="e.g., when you win a communist revolution L'MAO'"
                      value={inputPromptValue}
                      onChange={(e) => {
                        setInputPromptValue(e.target.value);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2 border h-[170px] mt-3 mb-2">
                  <>
                    {mnemonicImage ? (
                      <div className="col-span-1 bg-gray-1 h-full w-full">
                      <img
                        className="h-full w-auto object-contain"
                        src={mnemonicImage}
                        alt=""
                      /></div>
                    ) : (<div className="col-span-1 bg-gray-1 h-full w-full"></div>
                    )}

                    {acronym ? (
                      <div className="col-span-1 bg-gray-1 h-full w-full">
                      {acronym}</div>
                    ) : (<div className="col-span-1 bg-gray-1 h-full w-full"></div>
                    )}
                        <div className="col-span-1 bg-gray-1 h-full w-full"></div>
                  </>

                    
                  </div>
                  <div className="flex flex-wrap gap-3 place-content-center ">
                    <div className="flex items-start mt-1 gap-4">
                      <button
                        disabled={isLoadingMnemonic}
                        onClick={async () => {
                          setIsLoadingMnemonic(true);
                          await handleRecommeddedImage()
                          setIsLoadingMnemonic(false);}}
                        className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                        >
                        {isLoadingMnemonic && (
                          <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                        )}
                      Generate Mnemonic image
                    </button>
                    
                    </div>

                  </div>

                </div>
                <div className="col-span-1 h-full w-full">
                  <ul id="answer">
                    
                  </ul>
                  <p>Input below:</p>
                  <input
                    type="text"
                    id="newEntry"
                    className="p-2 w-full border border-gray-2 mt-1 mb-3 outline-none focus:border-gray-400 transition"
                    value={tableEntryValue}
                    onChange={(e) => {
                      setTableEntryValue(e.target.value);
                    }}
                  />
                  <button
                    onClick={async () => await handleAddToSequence()}
                    className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                    style={{ borderRadius: 5, padding: 5 }}
                  >
                    <AiOutlinePlus className="w-5 h-5" />

                    Add entry
                  </button>
                  <button
                        disabled={isLoadingMnemonic}
                        onClick={async () => {
                          setIsLoadingMnemonic(true);
                          await handleRecommeddedAcronym()
                          setIsLoadingMnemonic(false);}}
                        className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                        style={{ borderRadius: 5, padding: 5 , marginTop: 10}}
                        >
                        {isLoadingMnemonic && (
                          <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                        )}
                      Generate Acronym
                    </button>

                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <p className="text-2xl font-bold">I want to upload my own</p>
              <Link href={"/upload"}>
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <span>Videos</span>
                </a>
              </Link>
            </div>
            <div>
              <button
                onClick={async () => await handleUpload()}
                disabled={
                  !inputValue.trim() ||
                  isLoading
                }
                className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}

                style={{ borderRadius: 5, padding: 5 }}
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
