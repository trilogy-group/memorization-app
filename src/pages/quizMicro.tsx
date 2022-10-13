import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useRef, useState, FC } from "react";
import toast from "react-hot-toast";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";
import { useSession } from "next-auth/react";
import Sortable from 'sortablejs';

interface QuizMicroProps {
  refetch: Function;
  //arrayQuestion: string[];
  //arrayOfArrayCorrectAnswers: string[];
  //arrayType: string[];
  //arrayIncorrectAnswer: string[];
  //arraySrc: string[];
  //arrayDifficulty: string[];
}

//: FC<QuizMicroProps> = ({ inputQuestions, inputAnswer, inputType, inputIncorrectAnswer, inputHint,inputDifficulty }) =>
const QuizMicro: FC<QuizMicroProps> = ({ refetch }) => {
  const session = useSession();
  const quizGradeMutation = trpc.useMutation("progress.post-one-quiz-result");
  //const quizQuestionAnswersEtc = trpc.useMutation("progress.get-one-quiz");
  //const mnemonic_difficulty_Info = trpc.useMutation("progress.get-data-about-quiz-mnemonic-and-difficulty-using-quizId");
  const manyQuizzesWithInfo = trpc.useMutation("progress.get-many-quizzes");
  const [optionMCQ, setOptionMCQ] = useState();
  const [optionsList, setOptionsList] = useState<string[]>([]);
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [scoreArray, setScoreArray] = useState<number[]>([]);

  const [hintImageVisibility, setHintImageVisibility] = useState(true);
  const [hintVideoVisibility, setHintVideoVisibility] = useState(false);
  const [hintTextVisibility, setHintTextVisibility] = useState(false);

  const [quizContentVisibility, setQuizContentVisibility] = useState(true);
  const [MCQVisibility, setMCQVisibility] = useState(false);
  const [checkboxVisibility, setCheckboxVisibility] = useState(false);
  const [sequenceVisibility, setSequenceVisibility] = useState(false);
  const [scoreVisibility, setScoreVisibility] = useState(false);

  var allPresentCorrectCheckboxesList = useRef(["", ""]);

  var quizQuestion = useRef("no question in the beginning");
  var quizHintText = useRef("no instruction in the beginning");

  var optionAText = useRef("A");
  var optionBText = useRef("B");
  var optionCText = useRef("C");
  var optionDText = useRef("D");

  var quizInformationToRender = useRef<{ id: number, name: string, options: string, answer: string | null, type: string, conceptId: string }>({ id: 0, name: "", options: "", answer: "", type: "", conceptId: "" });

  var questionNumber = useRef(1);
  var score = useRef(0);

  var quizStart = useRef(0);
  var quizEnd: number;

  const sequenceRef = useRef<HTMLUListElement>(null);

  let arrayIncorrectAnswer = useRef([
    ["",
      "",
      ""
    ]
  ]);

  let arrayType = useRef<string[]>([]);


  let arrayOfArrayCorrectAnswers = useRef<string[][]>([]);


  let arrayQuestion = useRef<string[]>([]);

  let optionsThatIGetFromMassiveMCQDatabase = useRef<string[][]>([]);
  let correctnessOfOptionsThatIGetFromMassiveMCQDatabase = [] as boolean[];

  let arraySrc = useRef<string[]>([]);

  let postId = useRef<string[]>([]);

  let arrayQuestionDifficulty = useRef<number[]>([]);


  useEffect(() => {
    manyQuizzesWithInfo.mutateAsync().then(quizVariables => {
      if (quizVariables != null) {
        if (quizVariables.posts.length != quizVariables.quizzes.length || quizVariables.posts.length != quizVariables.progresses.length || quizVariables.quizzes.length != quizVariables.progresses.length) {
          toast("the returned arrays don't have the same length");
        }

        quizVariables.quizzes.forEach(quiz => arrayQuestion.current.push(quiz.name));
        quizVariables.quizzes.forEach(quiz => arrayType.current.push(quiz.type));
        quizVariables.progresses.forEach(progress => arrayQuestionDifficulty.current.push(progress.efactor));
        quizVariables.posts.forEach(post => arraySrc.current.push(post.coverURL));
        quizVariables.posts.forEach(post => postId.current.push(post.id));

        for (let i = 0; i < quizVariables.quizzes.length; i++) {
          if (arrayType.current[i] == "MCQ") {
            let optionsString = quizVariables.quizzes[i]?.options;
            let regexp = /desc': '([^']*)'/gm;
            let match = regexp.exec(optionsString as string);
            let arrayOfAnswersForThisInstance = new Array<string>;
            while (match != null) {
              arrayOfAnswersForThisInstance.push(match[1] as string);
              optionsThatIGetFromMassiveMCQDatabase.current.push(arrayOfAnswersForThisInstance);
              match = regexp.exec(optionsString as string);
            }

            regexp = /'is_correct': ([^}]*)}/gm;
            match = regexp.exec(optionsString as string);
            while (match != null) {
              correctnessOfOptionsThatIGetFromMassiveMCQDatabase.push(match[1] == "True" ? true : false);
              match = regexp.exec(optionsString as string);
            }

            let indexOfCorrectAnswerMCQ = correctnessOfOptionsThatIGetFromMassiveMCQDatabase.indexOf(true);
            arrayOfArrayCorrectAnswers.current[i] = [optionsThatIGetFromMassiveMCQDatabase.current[i]![indexOfCorrectAnswerMCQ] as string];
          }

        }

      }
      else {
        toast("problem with getting many quizzes from DB");
      }
      quizMakerUltimateHelper();
    });







    // adding script that makes elements of the list able to be dragged
    setTimeout(() => {
      var sortable = Sortable.create(sequenceRef.current as HTMLElement);

    }, 600);
    return () => {
    }

  }, []);

  const displayCheckboxes = () => {
    let optionsPresented = shuffle(allPresentCorrectCheckboxesList.current.concat(arrayIncorrectAnswer.current[questionNumber.current - 1] as string[]));
    return optionsPresented.map((item, index) => {

      return <div key={index}>
        <input
          style={{ fontStyle: "normal" }}
          type="checkbox"
          value={item}
          onChange={(e) => onChange(e)}
          key={item}
        />
        <label htmlFor={item} key={index}>
          {item}
        </label>
      </div>

    })
  }

  const displaySequence = () => {
    let sequencePresented = shuffle(arrayOfArrayCorrectAnswers.current[questionNumber.current - 1] as string[]);
    return sequencePresented.map((item) => {

      return <li className="border rounded flex items-center gap-2 h-9 px-3 border-black bg-white hover:bg-gray-100 transition cursor-pointer" key={item}>
        {item}
      </li>

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
      if (timeTaken < 5000) {
        return 2;
      } else if (timeTaken < 7000) {
        return 1;
      } else {
        return 0;
      }
    }
  }


  function checkAnswerUltimate() {
    // check answer AND clear existing q/a and answer AND push score array
    let newScoreArray = scoreArray;
    quizEnd = performance.now()
    let quizTime = quizEnd - quizStart.current;
    if (arrayType.current[questionNumber.current - 1] == "sequence") {
      let answers = new Array();
      let li = document.querySelectorAll("#sequence li");
      li.forEach(function (text) {
        answers.push(text.textContent);
      });
      if (JSON.stringify(arrayOfArrayCorrectAnswers.current![questionNumber.current - 1]) === JSON.stringify(answers)) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime)
        newScoreArray.push(0);
      }
      setScoreArray(newScoreArray);

    } else if (arrayType.current[questionNumber.current - 1] == "list") {
      if (JSON.stringify(optionsList) == JSON.stringify(arrayOfArrayCorrectAnswers.current![questionNumber.current - 1]?.sort())) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime);
        newScoreArray.push(0);
      }
      setScoreArray(newScoreArray);
      setCheckboxVisibility(false);
      optionsList.length = 0;
    } else if (arrayType.current[questionNumber.current - 1] == "MCQ") {
      if (optionMCQ == arrayOfArrayCorrectAnswers.current[questionNumber.current - 1]) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime);
        newScoreArray.push(0);
      }
      setScoreArray(newScoreArray);
      setMCQVisibility(false);
    }

    questionNumber.current = questionNumber.current + 1;

    // check if by any chance we have finished all the questions
    if (questionNumber.current - 1 == arrayQuestion.current.length) {
      setQuizContentVisibility(false);
      setScoreVisibility(true);
      if (!session.data?.user) {
        toast("You need to login");
      } else {

        quizGradeMutation
          .mutateAsync({
            postId: postId.current[questionNumber.current - 2] as string,
            grade: String(score.current)
          })
          .then(() => {
            refetch();
          })
          .catch((err) => {
            toast(err);
          });


      }

    } else {
      // create new question and new answer options and mnemonic hint
      quizMakerUltimateHelper()
    }
  }


  function quizMakerUltimateHelper() {

    if (arrayQuestionDifficulty.current[questionNumber.current - 1]! > 3) {
      setHintImageVisibility(false);
    }

    quizQuestion.current = arrayQuestion.current[questionNumber.current - 1] as string;
    if (arrayType.current[questionNumber.current - 1] == "sequence") {
      quizHintText.current = "Sort in the correct order";
      setSequenceVisibility(true);
    } else if (arrayType.current[questionNumber.current - 1] == "list") {
      quizHintText.current = "Choose all that apply";
      allPresentCorrectCheckboxesList.current = arrayOfArrayCorrectAnswers.current[questionNumber.current - 1] as string[];
      setCheckboxVisibility(true);

    } else if (arrayType.current[questionNumber.current - 1] == "MCQ") {
      // create MCQ options
      quizHintText.current = "Choose one";

      optionAText.current = optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![0] as string;
      setOptionA(optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![0] as string);
      optionBText.current = optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![1] as string;
      setOptionB(optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![1] as string);
      optionCText.current = optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![2] as string;
      setOptionC(optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![2] as string);
      optionDText.current = optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![3] as string;
      setOptionD(optionsThatIGetFromMassiveMCQDatabase.current[questionNumber.current - 1]![3] as string);

      setOptionMCQ(undefined);
      setMCQVisibility(true);
    }

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
            {scoreVisibility && <h1 id="scoreShownToUser" className="text-5xl font-bold" >Your score: {score.current}</h1>}
            {quizContentVisibility &&
              <div>
                <h1 className="text-2xl font-bold" id="question">{quizQuestion.current}</h1>
                <h1 id="hintText" className="text-1xl font-bold" >{quizHintText.current}</h1>
                {hintImageVisibility && <img id="hintImage" style={{ width: "200", height: "200" }} src={(arraySrc.current[questionNumber.current - 1] == null) ? "" : arraySrc.current[questionNumber.current - 1] as string} />}
                {hintVideoVisibility && <iframe id="hintVideo"
                  frameBorder='0'
                  allow='autoplay; encrypted-media'
                  allowFullScreen
                  title='video'
                />}
                <ul id="sequence" ref={sequenceRef}>
                  {sequenceVisibility && displaySequence()}
                </ul>
                {checkboxVisibility && <div>
                  {displayCheckboxes()}
                </div>}
                {MCQVisibility && <div onChange={e => { setOptionMCQ((e.target as any).value); }} id="MCQOptions">
                  <input type="radio" value={optionA} name="gender" checked={optionA === optionMCQ} onChange={e => { ; }} key="option a" /> <label id="optionA" key="option aa">{optionAText.current}</label>
                  <br />
                  <input type="radio" value={optionB} name="gender" checked={optionB === optionMCQ} onChange={e => { ; }} key="option b" /> <label id="optionB" key="option bb">{optionBText.current}</label>
                  <br />
                  <input type="radio" value={optionC} name="gender" checked={optionC === optionMCQ} onChange={e => { ; }} key="option c" /> <label id="optionC" key="option cc">{optionCText.current}</label>
                  <br />
                  <input type="radio" value={optionD} name="gender" checked={optionD === optionMCQ} onChange={e => { ; }} key="option d" /> <label id="optionD" key="option dd">{optionDText.current}</label>
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
