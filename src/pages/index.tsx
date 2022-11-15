import { createSSGHelpers } from "@trpc/react/ssg";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import superjson from "superjson";
import { useSession } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import Main from "@/components/Home/Main";
import Sidebar from "@/components/Home/Sidebar";
import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { prisma } from "@/server/db/client";
import { appRouter } from "@/server/router";
import { authOptions } from "./api/auth/[...nextauth]";
import { useState } from "react";


const Home: NextPage<HomeProps> = ({
  leaderboardAccounts,
  followingAccounts,
  origin,
}) => {

  const session = useSession();
  const [triggerRefetch, setTriggerRefetch] = useState<boolean>(false);

  return (
    <>
      <Meta
        title="EdTok - Share your Mnemonics"
        description="EdTok - create and share your mnemonics"
        image="/favicon.png"
      />
      <Navbar />

      <div className="flex justify-center mx-4">
        <div className="w-full max-w-[1920px] flex">
          <Sidebar
            leaderboardAccounts={leaderboardAccounts!}
            followingAccounts={followingAccounts!}
            triggerRefetch={triggerRefetch}
            onTriggerRefetchChange={setTriggerRefetch}
          />
          {
            (!session.data?.user) ?
              <div className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 transition">
                <p>Log in to see the content</p></div> :
              <Main
                origin={origin!}
                triggerRefetch={triggerRefetch}
                onTriggerRefetchChange={setTriggerRefetch}
              />
          }
          <div id="notificationArea" className="hide">
            <ToastContainer />
          </div>
        </div>

      </div>
    </>
  );
};

export default Home;

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>;

export const getServerSideProps = async ({
  req,
  res,
  query,
}: GetServerSidePropsContext) => {
  const session = await getServerSession(req, res, authOptions);

  const isFetchingFollowing = Boolean(Number(query.following));

  if (isFetchingFollowing && !session?.user?.email) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: true,
      },
      props: {},
    };
  }

  const ssg = createSSGHelpers({
    router: appRouter,
    ctx: {
      req: undefined,
      res: undefined,
      prisma,
      session,
    },
    transformer: superjson,
  });

  const [leaderboardAccounts, followingAccounts] = await Promise.all([
    prisma.user.findMany({
      take: 20,
      orderBy: [
        {
          points: 'desc',
        },
      ],
      select: {
        id: true,
        image: true,
        name: true,
        points: true,
      },
    }),
    session?.user
      ? prisma.follow.findMany({
        where: {
          // @ts-ignore
          followerId: session?.user?.id,
        },
        select: {
          following: {
            select: {
              id: true,
              image: true,
              name: true,
              points: true,
            },
          },
        },
      })
      : Promise.resolve([]),
    isFetchingFollowing
      ? ssg.fetchInfiniteQuery("post.following", {})
      : ssg.fetchInfiniteQuery("post.for-you", {}),
  ]);

  return {
    props: {
      trpcState: ssg.dehydrate(),
      session,
      leaderboardAccounts,
      followingAccounts: followingAccounts.map((item) => item.following),
      origin: `${req.headers.host?.includes("localhost") ? "http" : "https"
        }://${req.headers.host}`,
    },
  };
};
