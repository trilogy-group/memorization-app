import React, { useState, useEffect, useRef, DragEventHandler } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";

import RefreshIcon from "@mui/icons-material/Refresh";

import { TreeView, TreeItem } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
  TextField,
  Autocomplete,
} from "@mui/material";

import { trpc } from "../../utils/trpc";

import {
  Convert,
  ContentTree,
  Domain,
  Skill,
  Concept,
  Question,
} from "../../server/router/contentTreeInterface";

import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { fetchWithProgress } from "@/utils/fetch";
import Meta from "../Shared/Meta";
import { BsFillCloudUploadFill } from "react-icons/bs";

enum fileDataType {
  video,
  image,
  text,
  unknown,
}

interface ConceptState {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
}

const useConceptStore = create<ConceptState>()(
  devtools(
    persist(
      (set) => ({
        id: "",
        name: "",
        parentId: "",
        parentName: "",
      }),
      {
        name: "concept-storage",
      }
    )
  )
);

interface ConceptStateList {
  concepts: ConceptState[];
}

const useConceptListStore = create<ConceptStateList>()(
  devtools(
    persist(
      (set) => ({
        concepts: [],
      }),
      {
        name: "concept-list-storage",
      }
    )
  )
);

export type UploadProps = {
  open?: boolean;
  onClose: () => void;
  conceptId: string;
  questionId: string;
  addNodeToWorkspace: (
    nodeId: string,
    nodeName: string,
    parentId: string,
    parentName: string
  ) => void;
};



const Upload = ({
  open = false,
  onClose,
  conceptId,
  questionId,
  addNodeToWorkspace,
}: UploadProps) => {
  const router = useRouter();

  const uploadMutation = trpc.useMutation("post.createVideo");
  const uploadImgMutation = trpc.useMutation("post.createImg");

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [fileType, setFileType] = useState<fileDataType>(fileDataType.unknown);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [subjectValue, setSubjectValue] = useState<string[]>([]);
  const [chapterValue, setChapterValue] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFileDragging, setIsFileDragging] = useState(false);

  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);


  const handleImageFileChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setImageURL(url);
    setFileType(fileDataType.image);

    const image = document.createElement("img");
    image.style.opacity = "0";
    document.body.appendChild(image);
    image.setAttribute("src", url);

    document.body.appendChild(image);
    image.addEventListener("load", () => {
      setTimeout(() => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.drawImage(image, 0, 0);

        setCoverImageURL(canvas.toDataURL("image/png"));
      }, 300);
    });

    image.addEventListener("error", (error) => {
      console.log(error);
      document.body.removeChild(image);
      toast.error("Failed to load the image", {
        position: "bottom-right",
      });
    });
  };


  const handleVideoFileChange = (file: File) => {
    if (!file.type.startsWith("video")) {
      toast("Only video or image files are allowed");
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
    setFileType(fileDataType.video);

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

        setVideoWidth(video.videoWidth);
        setVideoHeight(video.videoHeight);

        ctx.drawImage(video, 0, 0);
        setCoverImageURL(canvas.toDataURL("image/png"));

        document.body.removeChild(video);
      }, 300);
    });
    video.load();
  };


  const handleFileChange = (file: File) => {
    if (file.type.startsWith("image")) {
      handleImageFileChange(file);
    } else if (file.type.startsWith("video")) {
      handleVideoFileChange(file);
    } else {
      throw new Error("Unknown upload data type. Expected video or image");
    }
  };


  const handleImageUpload = async () => {
    if (
      !coverImageURL ||
      !inputValue.trim() ||
      isLoading
    )
      return;
    setIsLoading(true);

    const toastID = toast.loading("Uploading...");
    try {
      const coverBlob = await (await fetch(coverImageURL)).blob();

      const formData = new FormData();
      formData.append("file", coverBlob, "cover.png");
      formData.append("content", "From webhook");

      const uploadedCover = (
        await (
          await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL!, {
            method: "POST",
            body: formData,
          })
        ).json()
      ).attachments[0].proxy_url;


      toast.loading("Uploading metadata...", { id: toastID });


      const created = await uploadImgMutation.mutateAsync({
        caption: inputValue.trim(),
        coverURL: uploadedCover,
        conceptId: conceptId,
        quizId: questionId,
      });
      toast.loading("Mnemonics Created! Points +1", { id: toastID });
      await new Promise(r => setTimeout(r, 800));

      toast.dismiss(toastID);

      setIsLoading(false);

      router.push(`/post/${created.id}`);
    } catch (error) {
      console.log(error);
      toast.dismiss(toastID);
      setIsLoading(false);
      toast.error("Failed to upload video", {
        position: "bottom-right",
        id: toastID,
      });

      return;
    };
  };


  const handleVideoUpload = async () => {
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

      let demo_response = await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL!, {
        method: "POST",
        body: formData,
      })
      demo_response = await demo_response.json()

      const uploadedCover = (
        await (
          await fetch(process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL!, {
            method: "POST",
            body: formData,
          })
        ).json()
      ).attachments[0].proxy_url;


      toast.loading("Uploading metadata...", { id: toastID });

      // Replace with concept from user input


      const created = await uploadMutation.mutateAsync({
        caption: inputValue.trim(),
        coverURL: uploadedCover,
        videoURL: uploadedVideo,
        videoHeight,
        videoWidth,
        conceptId: conceptId,
        quizId: questionId,
      });
      console.log("Concept ID: ", conceptId + " Question ID: ", questionId)
      toast.loading("Mnemonics Created! Points +1", { id: toastID });
      await new Promise(r => setTimeout(r, 800));

      toast.dismiss(toastID);

      setIsLoading(false);

      router.push(`/post/${created.id}`);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      toast.error("Failed to upload video", {
        position: "bottom-right",
        id: toastID,
      });
    }
  };


  const handleUpload = async () => {
    if (fileType == fileDataType.image) {
      handleImageUpload();
    } else if (fileType == fileDataType.video) {
      handleVideoUpload();
    } else {
      throw new Error("Unknown file type. Only support video/image uploading.");
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
    <Dialog open={open} onClose={onClose}>
      <Meta title="Upload | EdTok" description="Upload" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-2xl font-bold">Upload mnemonic media</h1>
            <p className="text-gray-400 mt-2">Memorize with your videos/images</p>

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
                    <p>MP4, WebM, PNG, JPG ...</p>
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

     
                  <button
                    onClick={async () => await handleUpload()}
                    disabled={
                      !inputValue.trim() ||
                      !((!videoURL ||
                        !videoFile ||
                        !coverImageURL) || (
                        !imageFile ||
                        !imageURL)
                      ) ||
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
      </div>
    </Dialog>
  );
};

export default Upload;
