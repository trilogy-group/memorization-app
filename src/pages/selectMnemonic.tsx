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

const SelectDataType: NextPage = () => {
  console.log(`upload component`)
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  return (
    <>
      <Meta title="SelectDataType | TopTop" description="SelectDataType" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4" id="deleteThis">
            <h1 className="text-2xl font-bold" >Sneed:</h1>
            <select name="data-type" id="dataTypeSelection">
              <option value="">--Please choose the type of data--</option>
              <option value="list">List of words</option>
              <option value="sequence">Sequence</option>
              <option value="linguistics">Linguistics</option>
            </select>
            <h1 className="text-2xl font-bold">Upload mnemonic video/image/audio</h1>
            <p className="text-gray-400 mt-2">Post a mnemonic file to your account</p>


          </div>
        </div>
      </div>
    </>
  );
};

export default SelectDataType;

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
