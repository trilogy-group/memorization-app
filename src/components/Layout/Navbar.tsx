import { useEffect } from "react";
import Image from "next/future/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { FC, FormEvent, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BiSearch, BiUser } from "react-icons/bi";
import { IoLogOutOutline } from "react-icons/io5";
import toast from "react-hot-toast";

import ClickAwayListener from "../Shared/ClickAwayListener";

import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { trpc } from "@/utils/trpc";

import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar: FC = () => {
  const [subjectValue, setSubjectValue] = useState<string[]>([]);
  const [chapterValue, setChapterValue] = useState<string[]>([]);

  const [notifications, setNotifications] = useState<{
    content: string[];
    status: number[];
  }>({ content: [], status: [] });

  const router = useRouter();
  const notificationMutation = trpc.useMutation("notification.for-you");

  const { data: session, status } = useSession();

  const [isDropdownOpened, setIsDropdownOpened] = useState(false);

  const [notificationVisibility, setNotificationVisibility] = useState(false);

  const [inputValue, setInputValue] = useState(
    router.pathname === "/search" && typeof router.query.q === "string"
      ? (router.query.q as string)
      : ""
  );

  useEffect(() => {
    notificationMutation.mutateAsync().then((notifs) => {
      console.log(notifs);
      setNotifications(notifs);
    });
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (inputValue.trim()) {
      router.push({
        pathname: "/search",
        query: {
          q: subjectValue + " " + chapterValue + " " + inputValue.trim(),
        },
      });
    }
  };

  const displayNotification = () => {
    const contentLst: string[] = notifications.content;
    const statusLst: number[] = notifications.status;

    return contentLst.map((n, i) => {
      if (n == "Quiz") {
        return <div>
          <Link href={`/quizUltimate`} key={i}>
            Go to Quiz Page
          </Link>
          <hr></hr>
        </div>;
      } else {
        return <div>
          <span className="notification" key={i}>
            {n}
          </span>
          <hr></hr>
        </div>;
      }
    });
  };
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <nav className="border-b sticky top-0 z-20 bg-white">
      <div className="flex justify-center mx-4">
        <div className="w-full max-w-[1150px] flex justify-between items-center h-[60px]">
          <Link href="/">
            <a className="flex items-end gap-1">
              <Image src="/logo.png" alt="Logo" width={30} height={30} />

              <span className="text-2xl leading-[1] font-bold">EdTok</span>
            </a>
          </Link>

          <form
            onSubmit={handleFormSubmit}
            className="relative w-[400px] h-[45px] hidden md:block"
          >
            <input
              className="w-full h-full outline-none bg-gray-1 rounded-full pl-4 pr-14 border border-transparent focus:border-gray-400"
              type="text"
              placeholder="Search by tags, e.g., #Spanish ..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <div className="absolute h-8 w-[1px] right-12 top-1/2 -translate-y-1/2 bg-gray-300"></div>
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <BiSearch className="fill-gray-400 w-6 h-6" />
            </button>
          </form>
          <div className="flex items-center gap-3">
            {/* @ts-ignore */}
            {
              !session?.user ? <></> :
                <div
                  className="notificationArea border rounded"
                  onClick={async () => {
                    setNotificationVisibility(!notificationVisibility);
                  }}
                >
                  <img
                    src="/notificationBell.svg"
                    className="notificationBell"
                  ></img>
                  <div className="notificationCounter">
                    {notifications.content.length}
                  </div>
                  {notificationVisibility && (
                    <div className="notifications" id="notifications">
                      {displayNotification()}
                    </div>
                  )}
                </div>
            }
            <div>
              <Button
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                  <AiOutlinePlus className="w-5 h-5" />
                  <span>Create</span>
                </a>
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                <MenuItem onClick={handleClose}>
                  <Link
                    href={
                      status === "authenticated" ? "/postlstwords" : "/sign-in"
                    }
                  >
                    Create a list of words
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Link
                    href={
                      status === "authenticated" ? "/postsequence" : "/sign-in"
                    }
                  >
                    Create a sequence
                  </Link>
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Link
                    href={
                      status === "authenticated" ? "/postdefinition" : "/sign-in"
                    }
                  >
                    Create a definition
                  </Link>
                </MenuItem>
              </Menu>
            </div>
            {status === "unauthenticated" ? (
              <Link href="/sign-in">
                <a className="rounded h-9 px-6 bg-pink text-white flex items-center hover:brightness-105 transition">
                  Log In
                </a>
              </Link>
            ) : status === "authenticated" ? (
              <ClickAwayListener onClickAway={() => setIsDropdownOpened(false)}>
                {(ref) => (
                  <div ref={ref} className="relative">
                    <button
                      onClick={() => setIsDropdownOpened(!isDropdownOpened)}
                    >
                      <Image
                        width={36}
                        height={36}
                        className="rounded-full"
                        src={session.user?.image!}
                        alt="Avatar"
                      />
                    </button>
                    <div
                      className={`absolute shadow-[rgb(0_0_0_/_12%)_0px_4px_16px] bg-white top-[120%] right-0 py-2 flex flex-col items-stretch [&>*]:whitespace-nowrap rounded-md transition-all z-50 ${isDropdownOpened
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                        }`}
                    >
                      {/* @ts-ignore */}
                      <Link href={`/user/${session?.user?.id}`}>
                        <a className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 transition">
                          <BiUser className="fill-black w-6 h-6" />
                          <span>Profile</span>
                        </a>
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 transition"
                      >
                        <IoLogOutOutline className="fill-black w-6 h-6" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </ClickAwayListener>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
