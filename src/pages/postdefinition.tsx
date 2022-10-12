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

const wordList: string[] = [];


const CreateDefinition: NextPage = () => {

  const uploadMutation = trpc.useMutation("post.createVideo");


  // TODO: connect mnemonic image with recommendation system in the backend
  const [mnemonicImage, setMnemonicImage] = useState<string | undefined>(undefined);
  const [acronym, setAcronym] = useState<string | undefined>(undefined);
  const [story, setStory] = useState<string | undefined>(undefined);


  const imgRecommendationMutation = trpc.useMutation("recommendImg.stabledif");
  const acroRecommendationMutation = trpc.useMutation("recommendAcro.acronym");
  const storyRecommendationMutation = trpc.useMutation("recommendStory.story");



  const [inputValue, setInputValue] = useState("");
  const [inputPromptValue, setInputPromptValue] = useState("");
  const [inputPostValue, setInputPostValue] = useState("");

  const [tableEntryValue, setTableEntryValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);

  function downloadImage() {
    fetch(mnemonicImage as RequestInfo, {
      mode: 'no-cors',
    })
      .then(response => response.blob())
      .then(blob => {
        let blobUrl = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        if (mnemonicImage != null) {
          a.download = mnemonicImage.replace(/^.*[\\\/]/, '');
          a.href = blobUrl;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }

      })
  }


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

  const handleRecommeddedStory = async () => {
    var storyWordList = "";

    //Get first leter for each word in wordList

    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        if (i == wordList.length - 1) {
          storyWordList += wordList[i];
        } else {
          storyWordList += wordList[i] + ", ";
        }
      }
    }
    const storyCreated = await storyRecommendationMutation.mutateAsync({
      description: storyWordList,
    });
    setStory("Remember " + storyWordList + " with: " + storyCreated?.result);
  }

  const handleUpload = async () => {
    // TODO: connect to the mnemonics generation backend
  };


  // TODO: connect list of words answer with the curricular graph
  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow place-items-center">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-2xl font-bold">Memorize a definition</h1>
            <div className="flex items-start mt-10 gap-4">
              <div className="grid grid-cols-2 gap-11 p-2 w-[100%] h-[75%] mt-5 mb-2">
                <div className="col-span-1 h-full w-full">
                  <div className="grid grid-cols-2 gap-1">
                    <Textarea
                      label="Enter your question"
                      placeholder="e.g., world leaders during WW2"
                      value={inputPostValue}
                      onChange={(e) => {
                        setInputPostValue(e.target.value);
                      }}
                    />
                    <Textarea
                      label="Prompt for generation"
                      placeholder="e.g., Panda eating bambu"
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
                          <textarea
                            className="w-full h-full p-1 border rounded resize-none readonly"
                            value={acronym}
                          />
                        </div>
                      ) : (<div className="col-span-1 bg-gray-1 h-full w-full"></div>
                      )}
                      {story ? (
                        <div className="col-span-1 bg-gray-1 h-full w-full">
                          <textarea
                            className="w-full h-full p-1 border rounded resize-none readonly"
                            value={story}
                          />
                        </div>
                      ) : (<div className="col-span-1 bg-gray-1 h-full w-full"></div>
                      )}
                    </>


                  </div>
                  <div className="flex flex-wrap gap-3 place-content-center ">
                    <div className="flex items-start mt-1 gap-4">
                      <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center" onClick={async () => {
                        downloadImage();
                      }}>
                        <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" /></svg>
                        <span>Download Image</span>
                      </button>
                      <button
                        disabled={isLoadingMnemonic}
                        onClick={async () => {
                          setIsLoadingMnemonic(true);
                          await handleRecommeddedImage()
                          setIsLoadingMnemonic(false);
                        }}
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
                  <textarea name="definition" className="border-2 border-gray-500">Sample text</textarea>
                  <button
                    disabled={isLoadingMnemonic}
                    onClick={async () => {
                      setIsLoadingMnemonic(true);
                      await handleRecommeddedAcronym()
                      setIsLoadingMnemonic(false);
                    }}
                    className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                    style={{ borderRadius: 5, padding: 5, marginTop: 10 }}
                  >
                    {isLoadingMnemonic && (
                      <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Generate Acronym
                  </button>

                  <button
                    disabled={isLoadingMnemonic}
                    onClick={async () => {
                      setIsLoadingMnemonic(true);
                      await handleRecommeddedStory()
                      setIsLoadingMnemonic(false);
                    }}
                    className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                    style={{ borderRadius: 5, padding: 5, marginTop: 10 }}
                  >
                    {isLoadingMnemonic && (
                      <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Generate Story
                  </button>

                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={"/upload"} className="" style={{ right: "-5px" }}>
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <span>Next</span>
                </a>
              </Link>
            </div>
            <div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateDefinition;

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
