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
import Checkbox from "@mui/material/Checkbox";



const QuizList: NextPage = () => {
  const router = useRouter();

  const uploadMutation = trpc.useMutation("video.create");

  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [inputValue, setInputValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);

  const [input, setInput] = useState("Denmark")

  useEffect(() => {

    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }

    return () => {
    }

  }, [uploadMutation.error]);


  // I need this as a template for a function. It can be deleted
  const handleGenerate = async () => {
    console.log("something something");
  };

  // shuffle is useless here; it can be deleted
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
      "Denmark",
      "Norway",
      "Belgium",
      "Netherlands ",
      "France ",
    ]
    ,
    // Second question
    [
      "Denmark",
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



  function checkAnswer() {

    if (questionNumber == 1) {
      let sortedArraySelected: string[] = selectedOptions.sort((n1, n2) => {
        if (n1 > n2) {
          return 1;
        }

        if (n1 < n2) {
          return -1;
        }

        return 0;
      });

      let sortedArrayCorrect: string[] = arrayOArrayCorrectAnswers[0].sort((n1, n2) => {
        if (n1 > n2) {
          return 1;
        }

        if (n1 < n2) {
          return -1;
        }

        return 0;
      });

      console.log(sortedArraySelected);
      console.log(sortedArrayCorrect);

      let correct = false;
      if (sortedArraySelected.length != sortedArrayCorrect.length) {
        //
      } else {
        for (var i = 0, l = sortedArraySelected.length; i < l; i++) {
          // recurse into the nested arrays
          if (!sortedArraySelected[i] == (sortedArrayCorrect[i])) {
            correct = false;
          } else if (sortedArraySelected[i] != sortedArrayCorrect[i]) {
            correct = false;
          }
        }
        correct = true;
      }

      if (correct) {
        score++;
      }

      //change question
      document.getElementById("question").innerHTML = "When did homo sapiens appear?";

      // change values of checkboxes
      document.getElementById("flexCheckDefault1").value = "200,000 years ago";
      document.getElementById("option1").innerHTML = "200,000 years ago";
      console.log("I hope", document.getElementById("flexCheckDefault1").value);

      document.getElementById("option2").innerHTML = "400,000 years ago";
      document.getElementById("option3").innerHTML = "4000 years ago";
      document.getElementById("option4").innerHTML = "5 years ago";
      document.getElementById("option5").innerHTML = "100,000 years ago";
      document.getElementById("option6").innerHTML = "1 milllion years ago";

      setSelectedOptions([]);

    } else if (questionNumber == 2) {
      console.log("answered second q");

      // SECOND QUESTION
      let sortedArraySelected: string[] = selectedOptions.sort((n1, n2) => {
        if (n1 > n2) {
          return 1;
        }

        if (n1 < n2) {
          return -1;
        }

        return 0;
      });

      let sortedArrayCorrect: string[] = arrayOArrayCorrectAnswers[1].sort((n1, n2) => {
        if (n1 > n2) {
          return 1;
        }

        if (n1 < n2) {
          return -1;
        }

        return 0;
      });

      console.log(sortedArraySelected);
      console.log(sortedArrayCorrect);

      let correct = false;
      if (sortedArraySelected.length != sortedArrayCorrect.length) {
        //
      } else {
        for (var i = 0, l = sortedArraySelected.length; i < l; i++) {
          // recurse into the nested arrays
          if (!sortedArraySelected[i] == (sortedArrayCorrect[i])) {
            correct = false;
          } else if (sortedArraySelected[i] != sortedArrayCorrect[i]) {
            correct = false;
          }
        }
        correct = true;
      }

      console.log(score);
      if (correct) {
        score++;
      }
      console.log(score);

      // delete everything
      document.getElementById("deleteAfterQuiz").style.display = 'none';

    }



    questionNumber++;


    document.getElementById("score").innerHTML = String(score);

    /*

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
      setSelectedOptions([]);
 
      // upload next hint
      document.getElementById("hint").setAttribute("src", "/hint2.png");
 
      // after answering the first question the dropdown for diffculty dissappears
      document.getElementById("difficulty-select").style.display = 'none';

    }

    questionNumber++;
    document.getElementById("score").innerHTML = String(score);
    */
  }

  const [userinfo, setUserInfo] = useState({
    languages: [],
    response: [],
  });

  var chosenOptions: Array<string> = [];
  var deleteThis = "";
  //let directions = new Set<string>();

  const handleChange = (e) => {
    // Destructuring
    let { value, checked } = e.target;
    const { languages } = userinfo;



    console.log(`${value} is ${checked}`);

    // Case 1 : The user checks the box
    if (checked) {
      setUserInfo({
        languages: [...languages, value],
        response: [...languages, value],
      });
      //chosenOptions.push(value);
      chosenOptions.push(e.target.value);
      console.log("added ", e.target.value)


      selectedOptions.push(e.target.value);
      setSelectedOptions(selectedOptions);

    }

    // Case 2  : The user unchecks the box
    else {
      setUserInfo({
        languages: languages.filter((e) => e !== value),
        response: languages.filter((e) => e !== value),
      });
      let indexToDelete = chosenOptions.indexOf(e.target.value, 0);
      if (indexToDelete > -1) {
        chosenOptions.splice(indexToDelete, 1);
      }
      //directions.add(e.target.value);
      console.log("removed ", e.target.value)

      let index = selectedOptions.indexOf(e.target.value, 0);
      if (index > -1) {
        selectedOptions.splice(index, 1);
      }
      setSelectedOptions(selectedOptions);
    }


  };


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
          <div className="w-full max-w-[1000px] p-8 bg-white my-4" id="deleteAfterQuiz">
            <select id="difficulty-select" onChange={e => { removeHints(e.target.selectedIndex); }} style={{ color: "red" }}>
              <option value="">--Please choose difficulty--</option>
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="difficult">Difficult</option>
            </select>
            <h1 className="text-2xl font-bold" id="question" >Germany in Blitzkrieg conquered ...</h1>
            <h2 className="text-2xl">check all that apply</h2>
            <img src="/hint1.png" id="hint" style={{ width: "200", height: "200" }} />

            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value={input}
              id="flexCheckDefault1"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault1"
              id="option1"
            >
              Denmark
            </label>

            <p>___</p>
            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value="Norway"
              id="flexCheckDefault2"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault2"
              id="option2"
            >
              Norway
            </label>
            <p>___</p>
            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value="Belgium"
              id="flexCheckDefault3"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault3"
              id="option3"
            >
              Belgium
            </label>

            <p>___</p>
            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value="Netherlands "
              id="flexCheckDefault4"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault4"
              id="option4"
            >
              Netherlands
            </label>
            <p>___</p>
            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value="France"
              id="flexCheckDefault5"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault5"
              id="option5"
            >
              France
            </label>

            <p>___</p>
            <input
              className="form-check-input"
              type="checkbox"
              name="languages"
              value="Australia "
              id="flexCheckDefault6"
              onChange={handleChange}
            />
            <label
              className="form-check-label"
              htmlFor="flexCheckDefault6"
              id="option6"
            >
              Australia
            </label>

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

export default QuizList;

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
