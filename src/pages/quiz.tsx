import type { GetServerSideProps, NextPage } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";
import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import React from "react";



const Quiz: NextPage = () => {

  const uploadMutation = trpc.useMutation("video.create");
  const [selectedOptions, setSelectedOptions] = useState([]);

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
      quizScript.innerHTML = "new Sortable(quiz);"
      document.body.appendChild(quizScript);
      console.log("added the sequence quiz script");
    }, 300);

    return () => {
      document.body.removeChild(script);
    }

  }, [uploadMutation.error]);


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

  //TODO: connect to DB for questions and answers
  const arrayOArrayCorrectAnswers = [
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
      "Stone Age",
      "Medieval times",
      "Modern Age",
      "Contemporary",
    ],
    // Third question
    [
      "Denmark",
      "Norway",
      "Belgium",
      "Netherlands ",
      "France ",
    ]
  ]

  //BEGIN CODE FOR MULTIPLE CORRECT QUIZ

  const [userinfo, setUserInfo] = useState({
    languages: [],
    response: [],
  });

  var chosenOptions: Array<string> = [];

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
  //END CODE FOR MULTIPLE CORRECT QUIZ

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

    } else if (questionNumber == 2) {
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

      //emptying the array of answers
      answers.length = 0

      // upload next hint
      document.getElementById("hint").setAttribute("src", "/hint3.png");
      document.getElementById("questionForMultipleCorrect").style.display = 'block';
      document.getElementById("multipleCorrect").style.display = 'block';
      document.getElementById("quiz").style.display = 'none';
      console.log("second is answered")

      score++;
    } else {



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
            <h1 className="text-2xl font-bold">Put the following events in chronological order:</h1>
            <div id="questionForMultipleCorrect" style={{ display: "none" }}>
              <h1 className="text-2xl font-bold" id="question" >Germany in Blitzkrieg conquered ...</h1>
              <h2 className="text-2xl">check all that apply</h2>
            </div>
            <img src="/hint1.png" id="hint" style={{ width: "200", height: "200" }} />
            <ul id="quiz"  >
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Germany invades Poland</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Mussolini becomes leader of Italy</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Emperor Hirohito leads Japan</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">The great depression</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Hirohito invades Manchuria</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Hitler becomes leader of Germany</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Mussolini invades Abyssinia</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Hitler invades Sudetenland</li>
              <li className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">Germany unifies Austria</li>
            </ul>
            <div id="multipleCorrect" style={{ display: "none" }}>
              <input
                className="form-check-input"
                type="checkbox"
                name="languages"
                value="Denmark"
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
            </div>
            <button
              onClick={async () => await checkAnswer()}
              id="nextButton"
              className="border rounded flex py-3 min-w-[170px] border border-gray-2 bg-red-1 hover:bg-gray-100 transition"
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
