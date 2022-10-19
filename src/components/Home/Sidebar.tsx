import Image from "next/future/image";
import Link from "next/link";
import Button from "@mui/material/Button";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Dispatch, FC, SetStateAction } from "react";
import { AiFillHome, AiOutlineHome, AiOutlinePlusCircle } from "react-icons/ai";
import { BsFillCheckCircleFill } from "react-icons/bs";
import { RiUserShared2Fill, RiUserShared2Line } from "react-icons/ri";
import toast from "react-hot-toast";

import { formatAccountName } from "@/utils/text";

import Navigation from "../navigation/navigation";

import { useEffect, useState } from "react";
import { trpc } from "@/utils/trpc";

interface User {
  id: string | null;
  image: string | null;
  name: string | null;
  points: number | 0;
}

interface SidebarProps {
  leaderboardAccounts: User[];
  followingAccounts: User[];
  triggerRefetch: boolean,
  onTriggerRefetchChange: Dispatch<SetStateAction<boolean>>,
}

interface ConceptState {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
}

const Sidebar: FC<SidebarProps> = ({
  leaderboardAccounts = [],
  followingAccounts = [],
  triggerRefetch = false,
  onTriggerRefetchChange = undefined,
}) => {
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);

  const addConceptMutation = trpc.useMutation("user.addConcept");

  const handleAddConcept = async (concept: ConceptState[]) => {
    for (let i = 0; i < concept.length; i++) {
      await addConceptMutation.mutateAsync({
        conceptId: concept[i]?.id || "",
      });
    }
    if (onTriggerRefetchChange) {
      console.log('refetch from handling add concepts');
      // Force trigger refetch
      onTriggerRefetchChange(!triggerRefetch);
      // Trigger refetch in the feeds
      if (triggerRefetch) {
        onTriggerRefetchChange(false);
      }
    }
  };

  return (
    <div className="w-[48px] border-r lg:border-none lg:w-[348px] h-[calc(100vh-60px)] sticky top-[60px] overflow-y-auto flex-shrink-0 py-5">
      <div className="flex flex-col items-stretch gap-5 [&_svg]:h-7 [&_svg]:w-7 font-semibold pb-6 border-b">
        <Navigation
          multiselect={true}
          questions={false}
          open={open}
          onClose={() => setOpen(false)}
          addNodeToWorkspace={function (
            nodeId: string,
            nodeName: string,
            parentId: string,
            parentName: string
          ): void {
            console.log(
              "Id: " +
              nodeId +
              " Name: " +
              nodeName +
              " ParentId: " +
              parentId +
              " ParentName: " +
              parentName
            );
          }}
          addNodeListToWorkspace={function (concepts: ConceptState[]): void {
            handleAddConcept(concepts);
          }}
        />
        <Link href="/">
          <a
            className={`flex items-center gap-2 ${!router.query.following
              ? "fill-pink text-pink"
              : "fill-black text-black"
              }`}
          >
            {!router.query.following ? <AiFillHome /> : <AiOutlineHome />}
            <span className="hidden lg:inline">For You</span>
          </a>
        </Link>
        <Link href="/">
          <a
            onClick={() => {
              if (!session.data?.user) {
                toast("You need to login");
                return;
              }
              console.log(open);
              setOpen(true);
              console.log(open);
            }}
            className={`flex items-center gap-2 fill-black text-black`}
          >
            {<AiOutlinePlusCircle />}
            <span className="hidden lg:inline">Select content</span>
          </a>
        </Link>
        <Link href={session.data?.user ? "/?following=1" : "/sign-in"}>
          <a
            className={`flex items-center gap-2 ${router.query.following
              ? "fill-pink text-pink"
              : "fill-black text-black"
              }`}
          >
            {router.query.following ? (
              <RiUserShared2Fill />
            ) : (
              <RiUserShared2Line />
            )}
            <span className="hidden lg:inline">Following</span>
          </a>
        </Link>
      </div>

      {leaderboardAccounts.length > 0 && session.data?.user && (
        <div className="flex flex-col items-stretch gap-3 py-4 border-b">
          <p className="text-sm hidden lg:block">Leaderboard</p>
          {leaderboardAccounts.map((account, index) => (
            <Link href={`/user/${account.id}`} key={account.id}>
              <a className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Image
                    className="rounded-full object-cover"
                    height={36}
                    width={36}
                    src={account.image!}
                    alt=""
                  />

                  <div className="hidden lg:block">
                    <p className="relative leading-[1]">
                      <span className="font-semibold text-sm">
                        {formatAccountName(account.name!)}
                      </span>
                      <BsFillCheckCircleFill className="absolute w-[14px] h-[14px] right-[-20px] top-1 fill-[#20D5EC]" />
                    </p>
                    <p className="font-light text-xs">{account.name}</p>
                  </div>
                </div>

                <div className="grid gap-2 grid-cols-2 items-center justify-center">
                  <Image
                    className="col-span-1 rounded-full object-cover"
                    style={{ marginLeft: 50 }}
                    height={17}
                    width={17}
                    src={"/star.png"}
                    alt=""
                  />
                  <div className="col-span-1">{account.points}</div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}
      {followingAccounts.length > 0 && (
        <div className="flex flex-col items-stretch gap-3 py-4 border-b">
          <p className="text-sm">Following Accounts</p>
          {followingAccounts.map((account) => (
            <Link href={`/user/${account.id}`} key={account.id}>
              <a className="flex items-center gap-3">
                <Image
                  className="rounded-full object-cover"
                  src={account.image!}
                  height={36}
                  width={36}
                  alt=""
                />

                <div>
                  <p className="relative leading-[1]">
                    <span className="font-semibold text-sm">
                      {formatAccountName(account.name!)}
                    </span>
                    <BsFillCheckCircleFill className="absolute w-[14px] h-[14px] right-[-20px] top-1 fill-[#20D5EC]" />
                  </p>
                  <p className="font-light text-xs">{account.name}</p>
                </div>
              </a>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
};

export default Sidebar;
