import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";



const Quiz: NextPage = () => {
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {

    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }

    // adding script that makes elements of the list able to be dragged PART 1
    const script = document.createElement('script');

    script.src = "https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js";
    script.async = true;

    document.body.appendChild(script);
    console.log("added da script");

    // adding script that makes elements of the list able to be dragged PART 2
    setTimeout(() => {
      let quizScript = document.createElement('script');

      quizScript.innerHTML = "new Sortable(quiz);"

      document.body.appendChild(quizScript);
    }, 300);



    return () => {
      document.body.removeChild(script);
      console.log("sdfdsfsdf");
    }

  }, [uploadMutation.error]);


  // I need this as a template for a function. It can be deleted
  const handleGenerate = async () => {
    console.log("something something");
  };

  function shuffle(arr: string[]): string[] {
    var myClonedArray = Object.assign([], arr);
    let m = myClonedArray.length;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      [myClonedArray[m], myClonedArray[i]] = [myClonedArray[i], myClonedArray[m]];
    }
    return myClonedArray;
  };


  let score = 0;
  let questionNumber = 1;

  const arrayOArrayCorrectAnswers = [
    // First question
    [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",]
    ,
    // Second question
    [
      "7",
      "8",
      "9",
      "10",
    ],
    // Third question
    [
      "a",
      "b",
      "c",
      "d",
      "e"
    ]
  ]


  console.log(shuffle(arrayOArrayCorrectAnswers[1]));

  console.log(arrayOArrayCorrectAnswers[1]);

  function checkAnswer() {
    var elem = document.getElementById("quiz");
    let answers = new Array();
    if (questionNumber == 1) {
      const li = document.querySelectorAll("#quiz li");

      li.forEach(function (text) {
        answers.push(text.innerHTML);
      });
      if (JSON.stringify(arrayOArrayCorrectAnswers[questionNumber - 1]) === JSON.stringify(answers)) {
        score++;
      }
      // clearing the elments in the unordered list
      while (elem.lastElementChild) {
        elem.removeChild(elem.lastElementChild);
      }

      // options for second question
      let shuffleOptions = shuffle(arrayOArrayCorrectAnswers[questionNumber])
      for (var i = 0; i < arrayOArrayCorrectAnswers[questionNumber]?.length; i++) {
        let option = document.createElement('li');
        option.className = "border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition"
        option.innerHTML = shuffleOptions[i];
        elem.appendChild(option);
        console.log("pushed ", option.innerHTML);
      }

      //emptying the array of answers
      answers.length = 0

      // upload next hint
      document.getElementById("hint").setAttribute("src", "/hint2.png");

      // after answering the first question the dropdown for diffculty dissappears
      document.getElementById("difficulty-select").style.display = 'none';

    } else {
      console.log("answered second question");
      // adding the answers of the second question to the stack
      for (var i = 0; i < elem.children.length; i++) {
        var option = elem.children[i];
        answers.push(option.innerHTML);

      }

      if (JSON.stringify(arrayOArrayCorrectAnswers[questionNumber - 1]) === JSON.stringify(answers)) {
        score++;
      }

      // clearing the elments in the unordered list
      while (elem.lastElementChild) {
        elem.removeChild(elem.lastElementChild);
      }

      // options for third question
      let shuffleOptions = shuffle(arrayOArrayCorrectAnswers[questionNumber])
      for (var i = 0; i < arrayOArrayCorrectAnswers[questionNumber]?.length; i++) {
        let option = document.createElement('li');
        option.className = "border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition"
        option.innerHTML = shuffleOptions[i];
        elem.appendChild(option);
        console.log("pushed ", option.innerHTML);
      }

      //emptying the array of answers
      answers.length = 0

      // upload next hint
      document.getElementById("hint").setAttribute("src", "/hint3.png");

    }

    questionNumber++;
    document.getElementById("score").innerHTML = String(score);

  }

  function removeHints(index: number): void {
    if (index != 1) {
      console.log("gonna remove images");
      document.getElementById("hint").style.display = 'none';
    }
    else {
      console.log("images stay");
      document.getElementById("hint").style.display = 'block';
    }
    return;
  };



  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-gray-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <select id="difficulty-select" onChange={e => { removeHints(e.target.selectedIndex); }} style={{ color: "red" }}>
              <option value="">--Please choose difficulty--</option>
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="difficult">Difficult</option>
            </select>
            <h1 className="text-2xl font-bold">Sort this</h1>
            <img src="/hint1.png" id="hint" style={{ width: "200", height: "200" }} />
            <ul id="quiz" >
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">1</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">2</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">5</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">3</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">4</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">6</li>
            </ul>
            <button
              onClick={async () => await checkAnswer()}

              className="border rounded flex py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
            >

              Next
            </button>
            <h1 className="text-2xl font-bold">Score</h1>
            <div id="score" className="text-2xl font-bold"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;

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
