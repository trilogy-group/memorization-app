import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useRef, useState, FC } from "react";
import toast from "react-hot-toast";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";
import { useSession } from "next-auth/react";

interface QuizMicroProps {
  refetch: Function;
}

//: FC<QuizMicroProps> = ({ inputQuestions, inputAnswer, inputType, inputIncorrectAnswer, inputHint,inputDifficulty }) =>
const QuizMicro: FC<QuizMicroProps> = ({ refetch }) => {
  const session = useSession();
  const quizGradeMutation = trpc.useMutation("progress.post-one-quiz-result");
  const quizQuestionAnswersEtc = trpc.useMutation("progress.get-one-quiz");
  const [optionMCQ, setOptionMCQ] = useState();
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [scoooreArray, setScoooreArray] = useState<number[]>([]);

  const [hintImageVisibility, setHintImageVisibility] = useState(false);
  const [hintVideoVisibility, setHintVideoVisibility] = useState(false);
  const [hintTextVisibility, setHintTextVisibility] = useState(false);

  const [quizContentVisibility, setQuizContentVisibility] = useState(true);
  const [MCQVisibility, setMCQVisibility] = useState(false);
  const [checkboxVisibility, setCheckboxVisibility] = useState(false);

  var allPresentCorrectCheckboxesList = useRef(["", ""]);

  var quizQuestion = useRef("no question in the beginning");
  var quizHintText = useRef("no instruction in the beginning");
  var optionAText = useRef("A");
  var optionBText = useRef("B");
  var optionCText = useRef("C");
  var optionDText = useRef("D");

  const [quizSetOfVariables, setQuizVariables] = useState<{ id: string, caption: string, videoURL: string, coverURL: string }>({ id: "", caption: "", videoURL: "", coverURL: "" });
  var deleteThis = useRef<{ id: string, caption: string, videoURL: string, coverURL: string }>({ id: "", caption: "", videoURL: "", coverURL: "" });

  var questionNumber = useRef(1);
  var score = useRef(0);

  var quizStart = useRef(0);
  var quizEnd: number;

  let arrayIncorrectAnswer = [
    ["Atavism",
      "Unipedalism",
      "Locomotion"
    ],
    ["wow",
      "that",
      "cringe"
    ]
  ];

  let arrayType = ["MCQ", "list"];

  //TODO: connect to DB for questions and answers
  const arrayOfArrayCorrectAnswers = [
    ["Bipedalism"],
    ["shrek", "fiona", "donkey"]

  ]

  let arrayQuestion = [
    "first Q",
    "second Q"
  ]


  useEffect(() => {
    quizQuestionAnswersEtc.mutateAsync().then(quizVariables => {
      console.log(quizVariables);
      if (quizVariables != null) {
        setQuizVariables(quizVariables);
        deleteThis.current = quizVariables;
      }
      console.log(quizSetOfVariables);
      if (quizSetOfVariables == null) {
        deleteThis.current.id = "not found";
        deleteThis.current.caption = "not found";
        deleteThis.current.videoURL = "not found";
        deleteThis.current.coverURL = "not found";
      }
      console.log("deletethis current ", deleteThis.current);
      quizMakerUltimateHelper()
    });

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
    }, 600);
    return () => {
    }

  }, []);

  const displayCheckboxes = () => {
    let optionsPresented = allPresentCorrectCheckboxesList.current.concat(arrayIncorrectAnswer[questionNumber.current - 1] as string[]);
    return optionsPresented.map((item, index) => {

      return <div>
        <input
          style={{ fontStyle: "normal" }}
          type="checkbox"
          value={item}
          onChange={(e) => onChange(e)}
        />
        <label htmlFor={item}>
          {item}
        </label>
      </div>

    })
  }


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


  function onChange(e: React.FormEvent<HTMLInputElement>) {
    // current array of options for quiz List
    const Newoptions = optionsList as Array<string>;
    let index;
    // check if the check box is checked or unchecked
    if ((e.target as any).checked) {
      // add the numerical value of the checkbox to options array
      Newoptions.push((e.target as any).value)
    } else {
      // or remove the value from the unchecked checkbox from the array
      index = Newoptions.indexOf((e.target as any).value)
      Newoptions.splice(index, 1)
    }
    // sort the array
    Newoptions.sort()
    console.log("the checked are ", Newoptions);
    // update the state with the new array of options
    setOptionsList(Newoptions);
  }


  /*
  function checkAnswerUltimate() {
    // check answer AND clear existing q/a and answer AND push score array

    // increment questionnumber

    // create new question and new options
    quizMakerUltimateHelper()
  }

  quizMakerUltimateHelper(questionnumber==1) is automatically used when the page is loaded
  */


  function getScoreBasedOnTimeTaken(correct: boolean, timeTaken: number) {
    if (correct) {
      if (timeTaken < 5000) {
        return 5;
      } else if (timeTaken < 7000) {
        return 4;
      } else {
        return 3;
      }
    } else {
      if (timeTaken < 7000) {
        return 2;
      } else if (timeTaken < 5000) {
        return 1;
      } else {
        return 0;
      }
    }
  }


  function checkAnswerUltimate() {
    // check answer AND clear existing q/a and answer AND push score array
    let newScoooreArray = scoooreArray;
    quizEnd = performance.now()

    console.log("quiz start is ", quizStart.current);
    console.log("quiz end is ", quizEnd);
    let quizTime = quizEnd - quizStart.current;
    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      //elem=sequenceRef.current;
      let answers = new Array();
      let li = document.querySelectorAll("#sequence li");
      li.forEach(function (text) {
        //answers.push(renderToString(text));
        answers.push(text.innerHTML);
      });
      if (JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]) === JSON.stringify(answers)) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoooreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime)
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      // clearing the elments in the unordered list
      while (elem!.lastElementChild) {
        elem!.removeChild(elem!.lastElementChild);
      }

    } else if (arrayType[questionNumber.current - 1] == "list") {
      if (JSON.stringify(optionsList) == JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]?.sort())) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoooreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime);
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      setCheckboxVisibility(false);
      optionsList.length = 0;
    }
    else if (arrayType[questionNumber.current - 1] == "MCQ") {
      if (optionMCQ == arrayOfArrayCorrectAnswers[questionNumber.current - 1]) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoooreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime);
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      setMCQVisibility(false);
    }

    questionNumber.current = questionNumber.current + 1;

    // check if by any chance we have finished all the questions
    if (questionNumber.current - 1 == arrayOfArrayCorrectAnswers.length) {
      setQuizContentVisibility(false);
      console.log("it took ", quizTime, "milliseconds");
      console.log(score.current);
      if (!session.data?.user) {
        toast("You need to login");
      } else {
        quizGradeMutation
          .mutateAsync({
            postId: deleteThis.current.id,
            grade: String(score.current)
          })
          .then(() => {
            refetch();
          })
          .catch((err) => {
            console.log(err);
          });
      }

    } else {
      // create new question and new answer options and mnemonic hint
      quizMakerUltimateHelper()
    }
  }


  function quizMakerUltimateHelper() {
    // quizQuestion.current = deleteThis.current.caption as string;
    quizQuestion.current = arrayQuestion[questionNumber.current - 1] as string;
    console.log(arrayQuestion[questionNumber.current - 1] as string);
    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      quizHintText.current = "Sort in the correct order";
      let shuffleOptions = shuffle(arrayOfArrayCorrectAnswers[questionNumber.current - 1] as unknown as Array<string>);
      for (var i = 0; i < arrayOfArrayCorrectAnswers[questionNumber.current - 1]!?.length; i++) {
        let option = document.createElement('li');
        option.className = "border rounded flex items-center gap-2 h-9 px-3 border-black bg-white hover:bg-gray-100 transition cursor-pointer"
        option.innerHTML = shuffleOptions[i] as string;
        elem!.appendChild(option);
      }
    } else if (arrayType[questionNumber.current - 1] == "list") {
      quizHintText.current = "Choose all that apply";
      allPresentCorrectCheckboxesList.current = arrayOfArrayCorrectAnswers[questionNumber.current - 1] as string[];
      setCheckboxVisibility(true);

    } else if (arrayType[questionNumber.current - 1] == "MCQ") {
      // create MCQ options
      quizHintText.current = "Choose one";
      optionAText.current = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string;
      setOptionA(arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string);
      optionBText.current = arrayIncorrectAnswer[questionNumber.current - 1]![0] as string;
      setOptionB(arrayIncorrectAnswer[questionNumber.current - 1]![0] as string);
      optionCText.current = arrayIncorrectAnswer[questionNumber.current - 1]![1] as string;
      setOptionC(arrayIncorrectAnswer[questionNumber.current - 1]![1] as string);
      optionDText.current = arrayIncorrectAnswer[questionNumber.current - 1]![2] as string;
      setOptionD(arrayIncorrectAnswer[questionNumber.current - 1]![2] as string);
      setOptionMCQ(undefined);
      setMCQVisibility(true);
    }
    console.log("this is the cover url", deleteThis.current.coverURL);
    console.log("this is the caption", deleteThis.current.caption);

  }


  return (
    <>
      <div className="min-h-screen flex flex-col items-stretch microQuiz">
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <div className="flex flex-col items-center justify-center">
            </div>
            <button id="startTimer" className="hidden" onClick={async () => (quizStart.current == 0) ?
              quizStart.current = performance.now() : 0}></button>
            {quizContentVisibility &&
              <div>
                <h1 className="text-2xl font-bold" id="question">{quizQuestion.current}</h1>
                <h1 id="hintText" className="text-1xl font-bold" >{quizHintText.current}</h1>
                <img id="hintImage" style={{ width: "200", height: "200" }} src={(deleteThis.current.coverURL == null) ? deleteThis.current.coverURL as string : ""} />
                <iframe id="hintVideo"
                  frameBorder='0'
                  allow='autoplay; encrypted-media'
                  allowFullScreen
                  title='video' className="hidden"
                />
                <ul id="sequence">
                </ul>
                {checkboxVisibility && <div>
                  {displayCheckboxes()}
                </div>}
                {MCQVisibility && <div onChange={e => { setOptionMCQ((e.target as any).value); }} id="MCQOptions">
                  <input type="radio" value={optionA} name="gender" checked={optionA === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionA">{optionAText.current}</label>
                  <br />
                  <input type="radio" value={optionB} name="gender" checked={optionB === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionB">{optionBText.current}</label>
                  <br />
                  <input type="radio" value={optionC} name="gender" checked={optionC === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionC">{optionCText.current}</label>
                  <br />
                  <input type="radio" value={optionD} name="gender" checked={optionD === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionD">{optionDText.current}</label>
                </div>}
                <div className="flex flex-col items-center justify-center">
                  <a href="#_" className="relative inline-flex items-center justify-start py-3 pl-4 pr-12 overflow-hidden font-semibold text-indigo-600 transition-all duration-150 ease-in-out rounded hover:pl-10 hover:pr-6 bg-gray-50 group" onClick={() => checkAnswerUltimate()}
                    id="nextButton">
                    <span className="absolute bottom-0 left-0 w-full h-1 transition-all duration-150 ease-in-out bg-indigo-600 group-hover:h-full"></span>
                    <span className="absolute right-0 pr-4 duration-200 ease-out group-hover:translate-x-12">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <span className="absolute left-0 pl-2.5 -translate-x-12 group-hover:translate-x-0 ease-out duration-200">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </span>
                    <span className="relative w-full text-left transition-colors duration-200 ease-in-out group-hover:text-white">Check Answer</span>
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizMicro;

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
