import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { AiOutlinePlus } from "react-icons/ai";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { authOptions } from "./api/auth/[...nextauth]";

const CreateMnemonics: NextPage = () => {

  return (
    <>
      <Meta title="Select | EdTok" description="Select Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <h1 className="text-4xl font-bold">I want to memorize...</h1>
            <div className="flex items-start mt-10 gap-4">
              <Link href={"/postlstwords"}>
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <AiOutlinePlus className="w-5 h-5" />
                  <span>A list of words</span>
                </a>
              </Link>
            </div>

            <div className="flex items-start mt-10 gap-4">
              <Link href={"/postsequence"}>
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <AiOutlinePlus className="w-5 h-5" />
                  <span>A list of sequences</span>
                </a>
              </Link>
            </div>

            <div className="flex items-start mt-10 gap-4">
              <Link href={"/createlstwords"}>
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <AiOutlinePlus className="w-5 h-5" />
                  <span>definitions</span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateMnemonics;

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
