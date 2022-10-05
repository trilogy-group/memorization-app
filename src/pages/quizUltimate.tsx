import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";



const QuizUltimate: NextPage = () => {

  const uploadMutation = trpc.useMutation("video.create");
  const [optionMCQ, setOptionMCQ] = useState();
  const [optionsList, setOptionsList] = useState([]);
  const [optionA, setOptionA] = useState("");
  const [scoooreArray, setScoooreArray] = useState<number[]>([]);

  var questionNumber = useRef(1);
  var score = useRef(0);


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

    // adding script that makes elements of the list able to be dragged PART 2
    setTimeout(() => {
      let quizScript = document.createElement('script');
      quizScript.innerHTML = "new Sortable(sequence);"
      document.body.appendChild(quizScript);
    }, 300);


    return () => {
      document.body.removeChild(script);
    }

  }, [uploadMutation.error]);


  function shuffle(arr: string[]): string[] {
    var myClonedArray = new Array<string>;
    myClonedArray = Object.assign([], arr);
    let m = myClonedArray.length;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      const arr_i = myClonedArray[i];
      const arr_m = myClonedArray[m];
      if (arr_i == null || arr_m == null) {
        throw new Error("Quiz answer entry null");
      } else {
        [myClonedArray[m], myClonedArray[i]] = [arr_i, arr_m];
      }
    }
    return myClonedArray;
  };

  function onChange(e) {
    // current array of options
    const Newoptions = optionsList;
    let index;

    // check if the check box is checked or unchecked
    if (e.target.checked) {
      // add the numerical value of the checkbox to options array
      Newoptions.push(e.target.value)
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = Newoptions.indexOf(e.target.value)
      Newoptions.splice(index, 1)
    }

    // sort the array
    Newoptions.sort()

    // update the state with the new array of options
    setOptionsList(Newoptions);
  }

  function onChangeMCQ(e) {
    setOptionMCQ(e.target.value);
  }



  //TODO: connect to DB for questions and answers
  const arrayOfArrayCorrectAnswers = [
    // First question
    [
      "Mussolini becomes leader of Italy",
      "Emperor Hirohito leads Japan",
      "The great depression",
      "Hirohito invades Manchuria",
      "Hitler becomes leader of Germany",
      "Mussolini invades Abyssinia",
      "Hitler invades Sudetenland",
      "Germany unifies Austria",
      "Germany invades Poland"
    ]
    ,
    // Second question
    [
      "Denmark",
      "Norway",
      "Belgium",
      "Netherlands",
      "France",
    ],
    // Third question
    ["200,000 years ago"],
    // Fourth question
    [
      "Stone Age",
      "Medieval times",
      "Modern Age",
      "Contemporary",
    ],
    // Fifth question
    ["2,4 million years ago"],
    // Sixth question
    ["Italy",
      "Australia",
      "Canada"
    ]
  ]


  /*
      A:
    array of src -> hints
    array of difficulty ->
    array of questions 
    array of answers
    array of types

  function checkAnswerUltimate() {
    // check answer AND clear existing q/a and answer AND push score array
    // increment questionnumber 'answered ith question'
    // create new question and new options
    quizMakerUltimateHelper()
  }

    function  quizMakerUltimateHelper() {
    // use src[questionnumber], difficulty[questionnumber], questions[questionnumber], answers[questionnumber], types[questionnumber]
  }

  quizMakerUltimateHelper(questionnumber==1) is automatically used when the page is loaded

  IMPORTANT NOTES:
  NO SHUFFLING AS MCQ AND LIST DON'T HAVE INCORRECT OPTION
  */

  let arraySrc //hints
  let arrayDifficulty
  let arrayQuestion = ["Put WW2 events in chronological order", "Out of all these countries, which was occupied by Germany in WW2?", "First homo sapiens appeared when?", "Put eras of human story in chronological order", "When did the Ice Age began?", "Which countries were NOT part of USSR?"]
  let arrayAnswer
  let arrayIncorrectAnswer
  let arrayType = ["sequence", "list", "MCQ", "sequence", "MCQ", "list"]

  function checkAnswerUltimate() {

    // check answer AND clear existing q/a and answer AND push score array

    /*
    IF TYPE==Sequence
    */
    let newScoooreArray = scoooreArray;
    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      let answers = new Array();
      let li = document.querySelectorAll("#sequence li");
      li.forEach(function (text) {
        answers.push(text.innerHTML);
      });
      if (JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]) === JSON.stringify(answers)) {
        score.current++;
        newScoooreArray.push(1);
      } else {
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);


      // clearing the elments in the unordered list
      while (elem!.lastElementChild) {
        elem!.removeChild(elem!.lastElementChild);
      }

    } else if (arrayType[questionNumber.current - 1] == "list") {
      if (JSON.stringify(optionsList) == JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]?.sort())) {
        score.current++;
        newScoooreArray.push(1);
      } else {
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);

      optionsList.length = 0;

      let possibleOptions = document.getElementById("checkBoxOptions");

      // clearing the elments in the possible options
      while (possibleOptions!.lastElementChild) {
        possibleOptions!.removeChild(possibleOptions!.lastElementChild);
      }
    }
    else if (arrayType[questionNumber.current - 1] == "MCQ") {
      // MCQ
      if (optionMCQ == arrayOfArrayCorrectAnswers[questionNumber.current - 1]) {
        score.current++;
        newScoooreArray.push(1);
      } else {
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      let MCQOptions = document.getElementById("MCQOptions");

      // clearing the elments in the possible options
      MCQOptions!.className = "hidden";
    }



    //TODO check accuracy and push score array
    document.getElementById("score")!.innerHTML = String(score.current);
    document.getElementById("hintVideo")!.className = "block";

    questionNumber.current = questionNumber.current + 1;

    // check if by any chance we have finished all the questions
    if (questionNumber.current - 1 == arrayOfArrayCorrectAnswers.length) {
      document.getElementById("question")!.style.display = 'none';
      document.getElementById("hintVideo")!.className = "hidden";
      document.getElementById("nextButton")!.className = "hidden";
      document.getElementById("score")!.className = "text-9xl font-bold";
      document.getElementById("hintText")!.className = "hidden";
      document.getElementById("scoreArray")!.innerHTML = String(newScoooreArray);

    }


    // create new question and new answer options and mnemonic hint
    quizMakerUltimateHelper()


  }

  function quizMakerUltimateHelper() {
    // use src[questionnumber], difficulty[questionnumber], questions[questionnumber], answers[questionnumber], types[questionnumber]

    // if difficulty[questionnumber]!=easy {document.getElementById("hint")!.style.display = 'none';}

    document.getElementById("question")!.innerHTML = arrayQuestion[questionNumber.current - 1] as string;

    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      //let shuffleOptions = shuffle(arrayOfArrayCorrectAnswers[questionNumber - 1] as Array<string>);
      let shuffleOptions = arrayOfArrayCorrectAnswers[questionNumber.current - 1] as Array<string>;
      for (var i = 0; i < arrayOfArrayCorrectAnswers[questionNumber.current - 1]!?.length; i++) {
        let option = document.createElement('li');
        option.className = "border rounded flex items-center gap-2 h-9 px-3 border-black bg-white hover:bg-gray-100 transition cursor-pointer"
        option.innerHTML = shuffleOptions[i] as string;
        elem!.appendChild(option);
      }

    } else if (arrayType[questionNumber.current - 1] == "list") {
      let possibleOptions = document.getElementById("checkBoxOptions");
      for (var i = 0; i < arrayOfArrayCorrectAnswers[questionNumber.current - 1]!?.length; i++) {

        let divOption = document.createElement('div');
        divOption.className = "input-group";

        let divOptionInput = document.createElement('input');
        divOptionInput.type = "checkbox";
        divOptionInput.value = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![i] as string;
        //divOptionInput.setAttribute("onchange", function(){toggleSelect(transport_select_id);});
        divOptionInput.onchange = onChange.bind(this);

        let divOptionLabel = document.createElement('label');
        divOptionLabel.innerHTML = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![i] as string;

        divOption.appendChild(divOptionInput);
        divOption.appendChild(divOptionLabel);

        possibleOptions!.appendChild(divOption);
      }
    } else if (arrayType[questionNumber.current - 1] == "MCQ") {
      // create MCQ options
      let MCQOptions = document.getElementById("MCQOptions");

      document.getElementById("optionA")!.innerHTML = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string;
      setOptionA(arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string);
      setOptionMCQ(undefined);
      MCQOptions!.onchange = onChangeMCQ.bind(this);

      MCQOptions!.className = "block";

    }

  }

  function removeHints(index: number): void {
    if (index != 1) {
      document.getElementById("hint")!.style.display = 'none';
    }
    else {
      document.getElementById("hint")!.style.display = 'block';
    }
    return;
  };



  return (
    <>
      <Meta title="Post Mnemonics | EdTok" description="Post Mnemonics" image="/favicon.png" />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">

            <div className="flex flex-col items-center justify-center">
              <a href="#_" className="relative inline-block text-lg group" id="startQuizButton" onClick={() => { document.getElementById("quizContent")!.className = "block"; quizMakerUltimateHelper(); document.getElementById("startQuizButton")!.className = "hidden"; }}>
                <span className="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white">
                  <span className="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span>
                  <span className="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"></span>
                  <span className="relative">Start Quiz</span>
                </span>
                <span className="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0" data-rounded="rounded-lg"></span>
              </a>
            </div>

            <div className="hidden" id="quizContent">
              <select id="difficulty-select" onChange={e => { removeHints(e.target.selectedIndex); }} style={{ color: "red" }} className="hidden">
                <option value="">--Please choose difficulty--</option>
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="difficult">Difficult</option>
              </select>
              <h1 className="text-2xl font-bold" id="question"></h1>
              <h1 id="hintText" className="text-1xl font-bold">Here's a hint</h1>
              <img id="hintImage" style={{ width: "200", height: "200" }} />
              <iframe id="hintVideo"
                frameBorder='0'
                allow='autoplay; encrypted-media'
                allowFullScreen
                title='video' className="hidden"
              />
              <ul id="sequence"  >
              </ul>
              <form id="checkBoxOptions">
              </form>
              <div onChange={e => { setOptionMCQ(e.target.value); }} id="MCQOptions" className="hidden">
                <input type="radio" value={optionA} name="gender" checked={optionA === optionMCQ} /> <label id="optionA">A</label>
                <br />
                <input type="radio" value="b" name="gender" /> <label id="optionB">B</label>
                <br />
                <input type="radio" value="c" name="gender" /> <label id="optionC">C</label>
                <br />
                <input type="radio" value="d" name="gender" /> <label id="optionD">D</label>
              </div>

              <div className="flex flex-col items-center justify-center">

                <a href="#_" className="relative inline-flex items-center justify-start py-3 pl-4 pr-12 overflow-hidden font-semibold text-indigo-600 transition-all duration-150 ease-in-out rounded hover:pl-10 hover:pr-6 bg-gray-50 group" onClick={async () => await checkAnswerUltimate()}
                  id="nextButton">

                  <span className="absolute bottom-0 left-0 w-full h-1 transition-all duration-150 ease-in-out bg-indigo-600 group-hover:h-full"></span>
                  <span className="absolute right-0 pr-4 duration-200 ease-out group-hover:translate-x-12">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                  <span className="absolute left-0 pl-2.5 -translate-x-12 group-hover:translate-x-0 ease-out duration-200">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </span>
                  <span className="relative w-full text-left transition-colors duration-200 ease-in-out group-hover:text-white">Next</span>
                </a>

                <h1 className="text-2xl font-bold">Score</h1>
                <div id="score" className="text-2xl font-bold"></div>
                <div id="scoreArray" className="text-2xl font-bold"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizUltimate;

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
