import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { DragEventHandler, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BsFillCloudUploadFill } from "react-icons/bs";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { fetchWithProgress } from "@/utils/fetch";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";
import ReactDOM from "react-dom";
import { sleep } from "react-query/types/core/utils";

var fileDataType = 0;
// 1 = image, 2=video, 3=audio

const Upload: NextPage = () => {
  console.log(`upload component`)
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  const inputRef = useRef<HTMLInputElement | null>(null);

  // added next line
  const inputRefImage = useRef<HTMLInputElement | null>(null);

  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");


  const [isLoading, setIsLoading] = useState(false);
  const [isFileDragging, setIsFileDragging] = useState(false);

  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);

  const handleFileChange = (file: File) => {
    console.log("selected file from PC")
    console.log(file.type)

    if (file.type.startsWith("image")) {
      const urlImage = URL.createObjectURL(file);
      const chosenImage = document.createElement("img");
      chosenImage.style.opacity = "0";
      // chosenImage.style.width = "0px";
      //chosenImage.style.height = "0px";
      document.body.appendChild(chosenImage);
      chosenImage.setAttribute("src", urlImage);

      chosenImage.addEventListener("load", () => {
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          canvas.width = chosenImage.width;
          canvas.height = chosenImage.height;

          console.log(canvas.width)
          console.log(canvas.height)

          ctx.drawImage(chosenImage, 0, 0);

          console.log("set cover image url mnemonic image 1");
          setCoverImageURL(canvas.toDataURL("image/png"));
          //  "https://avatars.mds.yandex.net/i?id=f51ce319fbbe5a197dce74134d6b57e8-5350081-images-thumbs&n=13"
          console.log(coverImageURL)
          console.log("set cover image url mnemonic image 2")

          //document.body.removeChild(chosenImage);
        }, 300);
      });

      fileDataType = 1;
      console.log(`selected image`)

    }

    if (file.type.startsWith("video")) {
      console.log(`selected video`)
      fileDataType = 2;
    }

    // VIDEOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO

    if (!file.type.startsWith("video")) {
      toast("Only video file is allowed");
      return;
    }


    // Max 200MB file size
    if (file.size > 209715200) {
      toast("Max 200MB file size");
      return;
    }

    const url = URL.createObjectURL(file);


    setVideoFile(file);
    setVideoURL(url);

    const video = document.createElement("video");
    video.style.opacity = "0";
    video.style.width = "0px";
    video.style.height = "0px";

    document.body.appendChild(video);

    video.setAttribute("src", url);
    video.addEventListener("error", (error) => {
      console.log(error);
      document.body.removeChild(video);
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    });

    video.addEventListener("loadeddata", () => {
      setTimeout(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        console.log(canvas.width)
        console.log(canvas.height)

        setVideoWidth(video.videoWidth);
        setVideoHeight(video.videoHeight);

        ctx.drawImage(video, 0, 0);
        setCoverImageURL(canvas.toDataURL("image/png"));

        document.body.removeChild(video);
      }, 300);
    });
    video.load();
  };

  const handleUpload = async () => {
    console.log(`Print pls`)

    if (fileDataType == 1) {
      console.log(`selected to upload image`)
      // BEGIN
      const coverBlob = await (await fetch(coverImageURL)).blob();

      const formData = new FormData();
      formData.append("file", coverBlob, "cover.png");
      formData.append("content", "From webhook");

      console.log(formData)

      let demo_response = await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL!, {
        method: "POST",
        body: formData,
      })
      console.log(`DemoResponse: `, demo_response)
      return;
      // END
    }


    console.log(`selected to upload video`)
    if (
      !coverImageURL ||
      !videoFile ||
      !videoURL ||
      !inputValue.trim() ||
      isLoading
    )
      return;

    setIsLoading(true);

    const toastID = toast.loading("Uploading...");

    try {
      const uploadedVideo = (
        await fetchWithProgress(
          "POST",
          new URL(
            "/upload?fileName=video.mp4",
            process.env.NEXT_PUBLIC_UPLOAD_URL!
          ).href,
          videoFile,
          (percentage) => {
            toast.loading(`Uploading ${percentage}%...`, { id: toastID });
          }
        )
      ).url;

      toast.loading("Uploading cover image...", { id: toastID });

      const coverBlob = await (await fetch(coverImageURL)).blob();

      const formData = new FormData();
      formData.append("file", coverBlob, "cover.png");
      formData.append("content", "From webhook");

      console.log(formData)

      let demo_response = await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL!, {
        method: "POST",
        body: formData,
      })
      console.log(`DemoResponse: `, demo_response)
      demo_response = await demo_response.json()

      const uploadedCover = (demo_response).attachments[0].proxy_url;

      toast.loading("Uploading metadata...", { id: toastID });

      const created = await uploadMutation.mutateAsync({
        caption: inputValue.trim(),
        coverURL: uploadedCover,
        videoURL: uploadedVideo,
        videoHeight,
        videoWidth,
      });

      toast.dismiss(toastID);

      setIsLoading(false);

      router.push(`/video/${created.id}`);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      toast.error("Failed to upload video", {
        position: "bottom-right",
        id: toastID,
      });
    }
  };


  const giveSuggestions = async () => {
    console.log("giving suggestions");
    try {
      var suggestions = document.createElement("textarea");
      suggestions.innerHTML = "Random text";

      var textAboveSuggestions = document.createElement("h1");
      /*
            var h = React.createElement(
              "h1",
              { className: "text-2xl font-bold" },
              "I'm suggesting you this mnemonic text"
            )
      */
      textAboveSuggestions.classList.add("text-2xl", "font-bold");
      textAboveSuggestions.innerHTML = "For " + document.getElementById("dataTypeSelection").value;
      //ReactDOM.render(h, document.getElementById("deleteThis"))
      document.getElementById("deleteThis").appendChild(textAboveSuggestions);
      document.getElementById("deleteThis").appendChild(suggestions);
    }
    catch (error) {
      console.log("problem with loading suggestions and the text for suggestion")
    }

  };



  const dragBlur: DragEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(false);
  };

  const dragFocus: DragEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDragging(true);
  };

  const dropFile = (e: any) => {
    console.log("dropping video")
    e.preventDefault();
    e.stopPropagation();

    let files = e.dataTransfer.files;

    if (files.length > 1) {
      toast("Only one file is allowed");
    } else {
      handleFileChange(files[0]);
    }

    setIsFileDragging(false);
  };


  return (
    <>
      <Meta title="Upload | TopTop" description="Upload" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4" id="deleteThis">
            <h1 className="text-2xl font-bold" >You are trying to memorize:</h1>
            <select name="data-type" id="type-select" id="dataTypeSelection">
              <option value="">--Please choose the type of data--</option>
              <option value="list">List of words</option>
              <option value="sequence">Sequence</option>
              <option value="linguistics">Linguistics</option>
            </select>
            <h1 className="text-2xl font-bold">Upload mnemonic video/image/audio</h1>
            <p className="text-gray-400 mt-2">Post a mnemonic file to your account</p>

            <div className="flex items-start mt-10 gap-4">
              {videoURL ? (
                <video
                  className="w-[250px] h-[340px] object-contain"
                  muted
                  autoPlay
                  controls
                  src={videoURL}
                  playsInline
                />
              ) : (
                <button
                  onDrop={dropFile}
                  onDragLeave={dragBlur}
                  onDragEnter={dragFocus}
                  onDragOver={dragFocus}
                  onClick={() => inputRef.current?.click()}
                  className={`w-[250px] flex-shrink-0 border-2 border-gray-300 rounded-md border-dashed flex flex-col items-center p-8 cursor-pointer hover:border-red-1 transition ${isFileDragging ? "border-red-1" : ""
                    }`}
                >
                  <BsFillCloudUploadFill className="fill-[#B0B0B4] w-10 h-10" />
                  <h1 className="font-semibold mt-4 mb-2">
                    Select a file to upload
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Or drag and drop a file
                  </p>

                  <div className="flex flex-col items-center text-gray-400 my-4 gap-1 text-sm">
                    <p>MP4 or WebM or image or audio</p>
                    <p>Any resolution</p>
                    <p>Any duration</p>
                    <p>Less than 200MB</p>
                  </div>

                  <div className="w-full bg-red-1 text-white p-2">
                    Select file
                  </div>
                </button>
              )}

              <input
                ref={inputRef}
                type="file"
                hidden
                className="hidden"
                accept="video/mp4,video/webm, image/*, audio/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="flex-grow">
                <label className="block font-medium" htmlFor="caption">
                  Caption
                </label>
                <input
                  type="text"
                  id="caption"
                  className="p-2 w-full border border-gray-2 mt-1 mb-3 outline-none focus:border-gray-400 transition"
                  value={inputValue}
                  onChange={(e) => {
                    if (!isLoading) setInputValue(e.target.value);
                  }}
                />

                <p className="font-medium">Cover</p>
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
                  <button
                    disabled={isLoading}
                    onClick={() => {
                      if (inputRef.current?.value) inputRef.current.value = "";
                      setCoverImageURL(null);
                      setInputValue("");
                      setVideoFile(null);
                      setVideoURL(null);
                    }}
                    className="py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
                  >
                    Discard
                  </button>
                  <button
                    onClick={async () => await handleUpload()}



                    className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                  >
                    {isLoading && (
                      <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                    )}
                    Post
                  </button>

                  <button
                    onClick={async () => await giveSuggestions()}

                    className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                  >

                    Get Suggestions in Text from GPT-3
                  </button>

                  <a href="http://127.0.0.1:5500/src/pages/quiz.html">
                    <button
                      className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                    >
                      Quiz
                    </button>
                  </a>




                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;

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
