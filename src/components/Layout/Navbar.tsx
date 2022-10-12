import { useEffect } from "react";
import Image from "next/future/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { FC, FormEvent, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { BiSearch, BiUser } from "react-icons/bi";
import { IoLogOutOutline } from "react-icons/io5";

import ClickAwayListener from "../Shared/ClickAwayListener";

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { trpc } from "@/utils/trpc";

const Navbar: FC = () => {
  const [subjectValue, setSubjectValue] = useState<string[]>([]);
  const [chapterValue, setChapterValue] = useState<string[]>([]);

  const [notifications, setNotifications] = useState<{ content: string[], status: number[] }>({ content: [], status: [] });

  const subjects = [
    '#Biology ',
    '#History ',
    '#Spanish ',
  ];

  const chapters = [
    '#Chapter1 ',
    '#Chapter2 ',
    '#Chapter3 ',
  ];

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

  useEffect(()=>{
    notificationMutation.mutateAsync().then(notifs => {
      console.log(notifs);
      setNotifications(notifs)});
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (inputValue.trim()) {
      router.push({ pathname: "/search", query: { q: subjectValue + " " + chapterValue + " " + inputValue.trim() } });
    }
  };


  const displayNotification = () => {
    const contentLst: string[] = notifications.content;
    const statusLst: number[] = notifications.status;

    return contentLst.map((n, i) => {
      if (n == "Quiz") {
        return <Link href={`/quizUltimate`} key={i}>Go to Quiz Page</Link>
      } else {
        return <span className="notification" key={i}>{n}</span>
      }
    })
  }

  return (
    <nav className="border-b sticky top-0 z-20 bg-white">
      <div className="flex justify-center mx-4">
        <div className="w-full max-w-[1150px] flex justify-between items-center h-[70px]">
          <Link href="/">
            <a className="flex items-end gap-1">
              <Image src="/logo.png" alt="Logo" width={30} height={30} />

              <span className="text-2xl leading-[1] font-bold">EdTok</span>
            </a>
          </Link>
          <div className='flex space-x-2 min-w-[30%]'>
            <Autocomplete
              value={subjectValue}
              onChange={(event, newValue) => {
                setSubjectValue(newValue);
              }}
              options={subjects}
              multiple
              limitTags={2}
              id="caption"
              className="p-1 w-full mt-1 mb-3 outline-none focus:border-gray-400 transition"
              style={{ paddingTop: 20, paddingBottom: 20, maxHeight: 90 }}
              renderInput={(params) => (
                <TextField {...params} label="Subject" placeholder="Biology, History, Spanish ..." />
              )}
              sx={{ width: '1/2' }}
            />
            <Autocomplete
              value={chapterValue}
              onChange={(event, newValue) => {
                setChapterValue(newValue);
              }}
              options={chapters}
              multiple
              limitTags={2}
              id="caption"
              className="p-1 w-full mt-1 mb-3 outline-none focus:border-gray-400 transition"
              style={{ paddingTop: 20, maxHeight: 90 }}
              renderInput={(params) => (
                <TextField {...params} label="Chapters" placeholder="Chapter 1, 2 ..." />
              )}
              sx={{ width: '1/2', height: '10' }}
            />
          </div>
          <form
            onSubmit={handleFormSubmit}
            className="relative w-[400px] h-[56px] hidden md:block"
          >
            <input
              className="w-full h-full outline-none bg-gray-1 rounded-full pl-4 pr-14 border border-transparent focus:border-gray-400 transition"
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
            <div className="notificationArea border rounded" onClick={async () => { setNotificationVisibility(!notificationVisibility); }}>
              <img src="/notificationBell.svg" className="notificationBell"></img>
              <div className="notificationCounter">{notifications.content.length}</div>
              {notificationVisibility && <div className="notifications" id="notifications">{displayNotification()}</div>}
            </div>
            <Link href={status === "authenticated" ? "/create-mnemonics" : "/sign-in"}>
              <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
                <AiOutlinePlus className="w-5 h-5" />
                <span>Create</span>
              </a>
            </Link>
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
