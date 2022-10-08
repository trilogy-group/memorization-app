import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import Image from "next/future/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { FC, useState } from "react";
import { BsPlay } from "react-icons/bs";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { prisma } from "@/server/db/client";
import { formatAccountName } from "@/utils/text";

import { authOptions } from "./api/auth/[...nextauth]";

enum Tabs {
  accounts,
  questions,
}

const Search: FC<SearchProps> = ({ questions, accounts }) => {
  const [currentTab, setCurrentTab] = useState(Tabs.accounts);
  const router = useRouter();

  return (
    <>
      <Meta
        title={`Find '${router.query.q}' on EdTok`}
        description="EdTok Search"
        image="/favicon.png"
      />
      <Navbar />
      <div className="flex justify-center mx-4">
        <div className="w-full max-w-[1150px]">
          <div className="flex gap-10 px-10 my-4 border-b">
            <button
              onClick={() => setCurrentTab(Tabs.accounts)}
              className={`py-1 font-medium transition border-b-2 ${currentTab === Tabs.accounts
                ? "border-black"
                : "text-gray-500 border-transparent"
                } `}
            >
              Accounts
            </button>
            <button
              onClick={() => setCurrentTab(Tabs.questions)}
              className={`py-1 font-medium transition border-b-2 ${currentTab === Tabs.questions
                ? "border-black"
                : "text-gray-500 border-transparent"
                } `}
            >
              Videos
            </button>
          </div>

          {currentTab === Tabs.accounts ? (
            <>
              {accounts?.length === 0 ? (
                <p className="text-center my-5">No result found</p>
              ) : (
                <div>
                  {accounts?.map((account) => (
                    <div
                      className="flex gap-3 items-center px-3 py-2"
                      key={account.id}
                    >
                      <Link href={`/user/${account.id}`}>
                        <a>
                          <Image
                            src={account.image!}
                            height={60}
                            width={60}
                            className="rounded-full object-cover"
                            alt=""
                          />
                        </a>
                      </Link>
                      <Link href={`/user/${account.id}`}>
                        <a>
                          <h1 className="text-lg font-semibold">
                            {formatAccountName(account?.name!)}
                          </h1>
                          <p className="text-sm text-gray-500">
                            {account?.name} · {account._count.followers}{" "}
                            Follower
                            {account._count.followers > 1 ? "s" : ""}
                          </p>
                        </a>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {questions?.length === 0 ? (
                <p className="text-center my-5">No result found</p>
              ) : (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,_minmax(120px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(200px,_1fr))]">
                  {questions?.map((question) => (
                    <div key={question.id}>
                      <Link href={`/question${question.id}`}>
                        <a className="block h-0 relative pb-[131%]">
                          <img
                            className="absolute inset-0 h-full w-full object-cover rounded"
                            src={question.coverURL}
                            alt=""
                          />
                          <BsPlay className="absolute left-3 bottom-3 fill-white w-7 h-7" />
                        </a>
                      </Link>
                      <p className="whitespace-nowrap overflow-hidden text-ellipsis my-1">
                        {question.caption}
                      </p>
                      <div className="flex items-center justify-between">
                        <Link href={`/user/${question.user.id}`}>
                          <a className="flex items-center gap-1">
                            <Image
                              src={question.user.image!}
                              width={20}
                              height={20}
                              alt=""
                              className="rounded-full object-cover"
                            />
                            <span>{formatAccountName(question.user.name!)}</span>
                          </a>
                        </Link>
                        <BsPlay className="fill-black w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Search;

type SearchProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export const getServerSideProps = async ({
  req,
  res,
  query,
}: GetServerSidePropsContext) => {
  var q = query.q as string;
  const tags = q.match(/(#[a-z\d-]+)/gi);
  // remove hashtags from caption searching
  if (tags != null) {
    for (const t_ of tags) {
      q = q.replace(t_, "");
    }
  }

  if (typeof q !== "string" || (!q && !tags)) {
    return {
      redirect: {
        destination: "/",
        permanent: true,
      },
      props: {},
    };
  }

  const session = await getServerSession(req, res, authOptions);

  let accounts, questions;
  if (tags != null) {
    [accounts, questions] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: {
            email: {
              search: q,
            },
            name: {
              search: q,
            },
          },
        },
        take: 20,
        select: {
          _count: {
            select: {
              followers: true,
            },
          },
          id: true,
          image: true,

          name: true,
        },
      }),
      prisma.question.findMany({
        where: {
          hashtags: {
            some: {
              tag: {in: tags},
            }
          }
        },
        take: 20,
        select: {
          id: true,
          coverURL: true,
          caption: true,
          user: {
            select: {
              id: true,
              image: true,
              name: true,
            },
          },
        },
      }),
    ]);

  }
  else {
    [accounts, questions] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: {
            email: {
              search: q,
            },
            name: {
              search: q,
            },
          },
        },
        take: 20,
        select: {
          _count: {
            select: {
              followers: true,
            },
          },
          id: true,
          image: true,

          name: true,
        },
      }),
      prisma.question.findMany({
        where: {
          caption: {
            search: q,
          },
        },
        take: 20,
        select: {
          id: true,
          coverURL: true,
          caption: true,
          user: {
            select: {
              id: true,
              image: true,
              name: true,
            },
          },
        },
      }),
    ]);
  }

  return {
    props: {
      session,
      questions,
      accounts,
    },
  };
};
