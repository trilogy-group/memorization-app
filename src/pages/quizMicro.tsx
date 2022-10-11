import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useRef, useState, FC } from "react";
import toast from "react-hot-toast";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";
import { useSession } from "next-auth/react";

interface QuizMicroProps {
  arrayQuestion: string[];
  arrayOfArrayCorrectAnswers: string[][];
  arrayType: string[];
  arrayIncorrectAnswer: string[];
  arraySrc: string[];
  arrayDifficulty: string[];
  refetch: Function;
}

//: FC<QuizMicroProps> = ({ inputQuestions, inputAnswer, inputType, inputIncorrectAnswer, inputHint,inputDifficulty }) =>
const QuizMicro: FC<QuizMicroProps> = ({ arrayQuestion, arrayOfArrayCorrectAnswers, arrayType, arrayIncorrectAnswer, arraySrc, arrayDifficulty, refetch }) => {
  const { data: session } = useSession();
  const quizGradeMutation = trpc.useMutation("progress.post-one-quiz-result");
  const quizQuestionAnswersEtc = trpc.useMutation("progress.get-one-quiz");
  const [optionMCQ, setOptionMCQ] = useState();
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [scoooreArray, setScoooreArray] = useState<number[]>([]);

  var questionNumber = useRef(1);
  var score = useRef(0);

  var quizStart = useRef(0);
  var quizEnd: number;

  let [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
  let timerRef: HTMLElement;
  let int: number | undefined;
  int = undefined;

  function displayTimer() {
    milliseconds += 10;
    if (milliseconds == 1000) {
      milliseconds = 0;
      seconds++;
      if (seconds == 60) {
        seconds = 0;
        minutes++;
        if (minutes == 60) {
          minutes = 0;
          hours++;
        }
      }
    }
    let h = hours < 10 ? "0" + hours : hours;
    let m = minutes < 10 ? "0" + minutes : minutes;
    let s = seconds < 10 ? "0" + seconds : seconds;
    let ms = milliseconds < 10 ? "00" + milliseconds : milliseconds < 100 ? "0" + milliseconds : milliseconds;

    timerRef.innerHTML = ` ${h} : ${m} : ${s} : ${ms}`;
  }

  useEffect(() => {
    quizQuestionAnswersEtc.mutateAsync().then(quizVariables => {
      console.log("the id of the user is ", session?.user?.id)
      console.log(quizVariables);
    });

    // adding script that makes elements of the list able to be dragged PART 1
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js";
    script.async = true;
    document.body.appendChild(script);
    quizMakerUltimateHelper()
    // adding script that makes elements of the list able to be dragged PART 2
    setTimeout(() => {
      let quizScript = document.createElement('script');
      quizScript.innerHTML = "new Sortable(sequence);"
      document.body.appendChild(quizScript);


      timerRef = document.querySelector('.timerDisplay') as HTMLElement;
      document.getElementById('startTimer')!.addEventListener('click', () => {
        if (quizStart.current == 0) {
          quizStart.current = performance.now();
        }

        if (int !== null) {
          clearInterval(int);
        }
        int = setInterval(displayTimer, 10) as unknown as number;
      });

      document.getElementById('pauseTimer')!.addEventListener('click', () => {
        clearInterval(int);
      });

      document.getElementById('resetTimer')!.addEventListener('click', () => {
        clearInterval(int);
        [milliseconds, seconds, minutes, hours] = [0, 0, 0, 0];
        timerRef.innerHTML = '00 : 00 : 00 : 000 ';
      });
    }, 600);
    return () => {
    }

  }, []);


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


  //TODO: connect to DB for questions and answers


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
  */




  function checkAnswerUltimate() {
    // check answer AND clear existing q/a and answer AND push score array
    let newScoooreArray = scoooreArray;
    quizEnd = performance.now()

    console.log("quiz start is ", quizStart.current);
    console.log("quiz end is ", quizEnd);
    let quizTime = quizEnd - quizStart.current;
    console.log(`It took quizTime milliseconds.`);
    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      let answers = new Array();
      let li = document.querySelectorAll("#sequence li");
      li.forEach(function (text) {
        answers.push(text.innerHTML);
      });
      if (JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]) === JSON.stringify(answers)) {
        if (quizTime < 5000) {
          score.current = 5;
        } else if (quizTime < 7000) {
          score.current = 4;
        } else {
          score.current = 3;
        }
        newScoooreArray.push(1);
      } else {
        if (quizTime < 7000) {
          score.current = 2;
        } else if (quizTime < 5000) {
          score.current = 1;
        } else {
          score.current = 0;
        }
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      // clearing the elments in the unordered list
      while (elem!.lastElementChild) {
        elem!.removeChild(elem!.lastElementChild);
      }

    } else if (arrayType[questionNumber.current - 1] == "list") {

      if (JSON.stringify(optionsList) == JSON.stringify(arrayOfArrayCorrectAnswers[questionNumber.current - 1]?.sort())) {
        if (quizTime < 5000) {
          score.current = 5;
        } else if (quizTime < 7000) {
          score.current = 4;
        } else {
          score.current = 3;
        }
        newScoooreArray.push(1);
      } else {
        if (quizTime < 7000) {
          score.current = 2;
        } else if (quizTime < 5000) {
          score.current = 1;
        } else {
          score.current = 0;
        }
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
      console.log(optionMCQ);

      // MCQ
      if (optionMCQ == arrayOfArrayCorrectAnswers[questionNumber.current - 1]) {
        if (quizTime < 5000) {
          score.current = 5;
        } else if (quizTime < 7000) {
          score.current = 4;
        } else {
          score.current = 3;
        }
        newScoooreArray.push(1);
      } else {
        if (quizTime < 7000) {
          score.current = 2;
        } else if (quizTime < 5000) {
          score.current = 1;
        } else {
          score.current = 0;
        }
        newScoooreArray.push(0);
      }
      setScoooreArray(newScoooreArray);
      let MCQOptions = document.getElementById("MCQOptions");
      // clearing the elments in the possible options
      MCQOptions!.className = "hidden";
    }
    //TODO check accuracy and push score array
    document.getElementById("hintVideo")!.className = "block";
    questionNumber.current = questionNumber.current + 1;
    // check if by any chance we have finished all the questions
    if (questionNumber.current - 1 == arrayOfArrayCorrectAnswers.length) {
      document.getElementById("question")!.style.display = 'none';
      document.getElementById("hintVideo")!.className = "hidden";
      document.getElementById("hintImage")!.className = "hidden"
      document.getElementById("nextButton")!.className = "hidden";
      document.getElementById("hintText")!.className = "hidden";

      console.log("it took ", quizTime, "milliseconds");
      console.log(score.current);
      if (!session.data?.user) {
        toast("You need to login");
      } else {
        quizGradeMutation
          .mutateAsync({
            questionId: "lalalalala",
            grade: String(score.current)
          })
          .then(() => {
            refetch();
          })
          .catch((err) => {
            console.log(err);
          });
      }

    }

    // create new question and new answer options and mnemonic hint
    quizMakerUltimateHelper()
  }


  function quizMakerUltimateHelper() {
    document.getElementById("question")!.innerHTML = arrayQuestion[questionNumber.current - 1] as string;
    if (arrayType[questionNumber.current - 1] == "sequence") {
      let elem = document.getElementById("sequence");
      document.getElementById("hintText")!.innerHTML = "Sort in the correct order";
      let shuffleOptions = shuffle(arrayOfArrayCorrectAnswers[questionNumber.current - 1] as unknown as Array<string>);
      for (var i = 0; i < arrayOfArrayCorrectAnswers[questionNumber.current - 1]!?.length; i++) {
        let option = document.createElement('li');
        option.className = "border rounded flex items-center gap-2 h-9 px-3 border-black bg-white hover:bg-gray-100 transition cursor-pointer"
        option.innerHTML = shuffleOptions[i] as string;
        elem!.appendChild(option);
      }
    } else if (arrayType[questionNumber.current - 1] == "list") {
      document.getElementById("hintText")!.innerHTML = "Choose all that apply";
      let possibleOptions = document.getElementById("checkBoxOptions");
      for (var i = 0; i < arrayOfArrayCorrectAnswers[questionNumber.current - 1]!?.length; i++) {
        let divOption = document.createElement('div');
        divOption.className = "input-group";
        let divOptionInput = document.createElement('input');
        divOptionInput.type = "checkbox";
        divOptionInput.value = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![i] as string;
        divOptionInput.onchange = onChange.bind(this);
        let divOptionLabel = document.createElement('label');
        divOptionLabel.innerHTML = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![i] as string;
        divOption.appendChild(divOptionInput);
        divOption.appendChild(divOptionLabel);
        possibleOptions!.appendChild(divOption);
      }

      for (var i = 0; i < arrayIncorrectAnswer[questionNumber.current - 1]!?.length; i++) {
        let divOption = document.createElement('div');
        divOption.className = "input-group";
        let divOptionInput = document.createElement('input');
        divOptionInput.type = "checkbox";
        divOptionInput.value = arrayIncorrectAnswer[questionNumber.current - 1]![i] as string;
        divOptionInput.onchange = onChange.bind(this);
        let divOptionLabel = document.createElement('label');
        divOptionLabel.innerHTML = arrayIncorrectAnswer[questionNumber.current - 1]![i] as string;
        divOption.appendChild(divOptionInput);
        divOption.appendChild(divOptionLabel);
        possibleOptions!.appendChild(divOption);
      }
    } else if (arrayType[questionNumber.current - 1] == "MCQ") {
      // create MCQ options
      let MCQOptions = document.getElementById("MCQOptions");
      document.getElementById("hintText")!.innerHTML = "Choose one";
      document.getElementById("optionA")!.innerHTML = arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string;
      setOptionA(arrayOfArrayCorrectAnswers[questionNumber.current - 1]![0] as string);

      document.getElementById("optionB")!.innerHTML = arrayIncorrectAnswer[questionNumber.current - 1]![0] as string;
      setOptionB(arrayIncorrectAnswer[questionNumber.current - 1]![0] as string);
      document.getElementById("optionC")!.innerHTML = arrayIncorrectAnswer[questionNumber.current - 1]![1] as string;
      setOptionC(arrayIncorrectAnswer[questionNumber.current - 1]![1] as string);
      document.getElementById("optionD")!.innerHTML = arrayIncorrectAnswer[questionNumber.current - 1]![2] as string;
      setOptionD(arrayIncorrectAnswer[questionNumber.current - 1]![2] as string);

      setOptionMCQ(undefined);
      MCQOptions!.className = "block";
    }
    document.getElementById("hintImage")?.setAttribute("src", arraySrc[questionNumber.current - 1] as string)
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
      <div className="min-h-screen flex flex-col items-stretch microQuiz">
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <div className="flex flex-col items-center justify-center">
            </div>
            <div id="quizContent">
              <div className="stopwatch">
                <div className="timerDisplay">
                  00 : 00 : 00 : 000
                </div>
                <div className="buttons">
                  <button id="pauseTimer">Pause</button>
                  <button id="startTimer">Start</button>
                  <button id="resetTimer">Reset</button>
                </div>
              </div>
              <h1 className="text-2xl font-bold" id="question"></h1>
              <h1 id="hintText" className="text-1xl font-bold">Sort in correct order</h1>
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
              <div onChange={e => { setOptionMCQ((e.target as any).value); }} id="MCQOptions" className="hidden">
                <input type="radio" value={optionA} name="gender" checked={optionA === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionA">A</label>
                <br />
                <input type="radio" value={optionB} name="gender" checked={optionB === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionB">B</label>
                <br />
                <input type="radio" value={optionC} name="gender" checked={optionC === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionC">C</label>
                <br />
                <input type="radio" value={optionD} name="gender" checked={optionD === optionMCQ} onChange={e => { console.log(e.target.value); }} /> <label id="optionD">D</label>
              </div>
              <div className="flex flex-col items-center justify-center">
                <a href="#_" className="relative inline-flex items-center justify-start py-3 pl-4 pr-12 overflow-hidden font-semibold text-indigo-600 transition-all duration-150 ease-in-out rounded hover:pl-10 hover:pr-6 bg-gray-50 group" onClick={async () => await checkAnswerUltimate()}
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
