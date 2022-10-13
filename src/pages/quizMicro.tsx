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

/*
!!! hard coded DOM             DONE
remove console log 
naming is bad
sequence use npm i             DONE
display the score to the user       DONE
!!! get question data from mutation + hint
!!! send score to backend            DONE
*/

// my question 1: get difficulty from progress using mutation or its passed as an argument along with other data?
// my question 2: if option is a string, how should you mark the end of it; how to parse it into an array? |
// my question 3 :the mutation to get the quiz: how to find the specific entry in Quiz entry, return only the first entry?
// my question 4 :where do I get source for the mnemonic?

//  takes list of questions

//: FC<QuizMicroProps> = ({ inputQuestions, inputAnswer, inputType, inputIncorrectAnswer, inputHint,inputDifficulty }) =>
const QuizMicro: FC<QuizMicroProps> = ({ refetch }) => {
  const session = useSession();
  const quizGradeMutation = trpc.useMutation("progress.post-one-quiz-result");
  const quizQuestionAnswersEtc = trpc.useMutation("progress.get-one-quiz");
  const mnemonicInfo = trpc.useMutation("progress.get-data-about-post-using-quizId");
  const questionDifficultyInfo = trpc.useMutation("progress.get-data-about-quiz-difficulty-using-quizId");
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
    ],
    ["wow",
      "that",
      "cringe"
    ]
  ]);

  let arrayType = useRef(["", "list", "sequence"]);

  //TODO: connect to DB for questions and answers
  let arrayOfArrayCorrectAnswers = useRef([
    [""],
    ["shrek", "fiona", "donkey"],
    ["1",
      "2",
      "3",
      "4"]
  ])


  let arrayQuestion = useRef([""]);

  let optionsThatIGetFromMassiveMCQDatabase = [] as string[];
  let correctnessOfOptionsThatIGetFromMassiveMCQDatabase = [] as boolean[];

  let arraySrc = useRef([""]);

  let postId = useRef("");

  let questionDifficulty = useRef(-1);


  useEffect(() => {

    quizQuestionAnswersEtc.mutateAsync().then(quizVariables => {
      console.log("info that I will use to render the quiz ", quizVariables);
      if (quizVariables != null) {
        quizInformationToRender.current = quizVariables;
        console.log("id passed to search post ", quizInformationToRender.current.id);
        console.log("what I have ", quizInformationToRender.current);
        console.log("what options I have ", quizInformationToRender.current.options);

        let string = quizInformationToRender.current.options;
        let regexp = /desc': '([^']*)'/gm;
        let match = regexp.exec(string);
        while (match != null) {
          console.log(match[1])
          optionsThatIGetFromMassiveMCQDatabase.push(match[1] as string);
          match = regexp.exec(string);
        }

        regexp = /'is_correct': ([^}]*)}/gm;
        match = regexp.exec(string);
        while (match != null) {
          console.log(match[1])
          correctnessOfOptionsThatIGetFromMassiveMCQDatabase.push(match[1] == "True" ? true : false);
          match = regexp.exec(string);
        }

        console.log(optionsThatIGetFromMassiveMCQDatabase);
        console.log(correctnessOfOptionsThatIGetFromMassiveMCQDatabase);

        let indexOfCorrectAnswerMCQ = correctnessOfOptionsThatIGetFromMassiveMCQDatabase.indexOf(true);
        arrayQuestion.current[0] = quizInformationToRender.current.name;
        arrayType.current[0] = quizInformationToRender.current.type;
        arrayOfArrayCorrectAnswers.current[0] = [optionsThatIGetFromMassiveMCQDatabase[indexOfCorrectAnswerMCQ] as string];


        mnemonicInfo.mutateAsync({
          quizId: quizInformationToRender.current.id,
        }).then(quizVariables => {
          console.log("info that I will use to render the quiz ", quizVariables);
          if (quizVariables != null) {
            arraySrc.current[0] = quizVariables.coverURL;
            postId.current = quizVariables.id;
          }
          else {
            console.log("problem with getting mnemonic info from DB");
          }
        });

        questionDifficultyInfo.mutateAsync({
          quizId: quizInformationToRender.current.id,
        }).then(quizVariables => {
          console.log("info that I will use to determine the difficulty ", quizVariables);
          if (quizVariables != null) {
            questionDifficulty.current = quizVariables.efactor;
          }
          else {
            console.log("problem with getting difficulty info from DB");
          }
        });


      }
      else {
        console.log("problem with getting quiz info from DB");
      }
    });





    // adding script that makes elements of the list able to be dragged
    setTimeout(() => {
      var sortable = Sortable.create(sequenceRef.current as HTMLElement);
      quizMakerUltimateHelper();
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
    console.log("quiz start is ", quizStart.current);
    console.log("quiz end is ", quizEnd);
    let quizTime = quizEnd - quizStart.current;
    if (arrayType.current[questionNumber.current - 1] == "sequence") {
      console.log("correct sequence ", arrayOfArrayCorrectAnswers.current![questionNumber.current - 1]);
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
      console.log("correct list ", arrayOfArrayCorrectAnswers.current![questionNumber.current - 1]);
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
      console.log("correct MCQ ", arrayOfArrayCorrectAnswers.current![questionNumber.current - 1]);
      if (optionMCQ == arrayOfArrayCorrectAnswers.current[questionNumber.current - 1]) {
        score.current = getScoreBasedOnTimeTaken(true, quizTime);
        newScoreArray.push(1);
      } else {
        score.current = getScoreBasedOnTimeTaken(false, quizTime);
        newScoreArray.push(0);
      }
      setScoreArray(newScoreArray);
      setMCQVisibility(false);
      console.log("mcq visibility", MCQVisibility);
    }

    questionNumber.current = questionNumber.current + 1;

    // check if by any chance we have finished all the questions
    if (questionNumber.current - 1 == arrayOfArrayCorrectAnswers.current.length) {
      setQuizContentVisibility(false);
      setScoreVisibility(true);
      console.log("it took ", quizTime, "milliseconds");
      console.log(score.current);
      console.log(newScoreArray);
      if (!session.data?.user) {
        toast("You need to login");
      } else {

        quizGradeMutation
          .mutateAsync({
            postId: postId.current,
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

    console.log("options that should be displayed from DB ", optionsThatIGetFromMassiveMCQDatabase);
    console.log("current question from DB ", arrayQuestion.current);
    console.log("current type from DB ", arrayType.current);
    console.log("current array of correct answers from DB ", arrayOfArrayCorrectAnswers.current);

    console.log("post id is ", postId.current);
    console.log("difficulty factor is ", questionDifficulty.current);

    if (questionDifficulty.current > 3) {
      setHintImageVisibility(false);
    }


    quizQuestion.current = arrayQuestion.current[questionNumber.current - 1] as string;
    console.log(arrayQuestion.current[questionNumber.current - 1] as string);
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
      optionAText.current = optionsThatIGetFromMassiveMCQDatabase[0] as string;
      setOptionA(optionsThatIGetFromMassiveMCQDatabase[0] as string);
      optionBText.current = optionsThatIGetFromMassiveMCQDatabase[1] as string;
      setOptionB(optionsThatIGetFromMassiveMCQDatabase[1] as string);
      optionCText.current = optionsThatIGetFromMassiveMCQDatabase[2] as string;
      setOptionC(optionsThatIGetFromMassiveMCQDatabase[2] as string);
      optionDText.current = optionsThatIGetFromMassiveMCQDatabase[3] as string;
      setOptionD(optionsThatIGetFromMassiveMCQDatabase[3] as string);
      setOptionMCQ(undefined);
      setMCQVisibility(true);
    }
    //console.log("this is the cover url", quizInformationToRender.current.coverURL);
    //console.log("this is the caption", quizInformationToRender.current.caption);

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
                {hintImageVisibility && <img id="hintImage" style={{ width: "200", height: "200" }} src={(arraySrc.current[0] == null) ? "" : arraySrc.current[0] as string} />}
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
                  <input type="radio" value={optionA} name="gender" checked={optionA === optionMCQ} onChange={e => { console.log(e.target.value); }} key="option a" /> <label id="optionA" key="option aa">{optionAText.current}</label>
                  <br />
                  <input type="radio" value={optionB} name="gender" checked={optionB === optionMCQ} onChange={e => { console.log(e.target.value); }} key="option b" /> <label id="optionB" key="option bb">{optionBText.current}</label>
                  <br />
                  <input type="radio" value={optionC} name="gender" checked={optionC === optionMCQ} onChange={e => { console.log(e.target.value); }} key="option c" /> <label id="optionC" key="option cc">{optionCText.current}</label>
                  <br />
                  <input type="radio" value={optionD} name="gender" checked={optionD === optionMCQ} onChange={e => { console.log(e.target.value); }} key="option d" /> <label id="optionD" key="option dd">{optionDText.current}</label>
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
