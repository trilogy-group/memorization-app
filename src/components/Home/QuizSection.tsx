import { Quiz } from "@prisma/client";
import { useEffect, useRef, useState, FC } from "react";
import { trpc } from "@/utils/trpc";
import React from "react";
import { useSession } from "next-auth/react";
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import { QuizType, Option } from "@/utils/text";


interface QuizSectionProps {
  quiz: Quiz[];
  origin: string;
  refetch: Function;
}

/*
Quiz
{
    name: string,
    type: string,
    options: string,
    answer: string,
    conceptId: string,
  }
*/
const QuizSection: FC<QuizSectionProps> = ({ quiz, refetch, origin }) => {
  const session = useSession();

  const quizPostMutation = trpc.useMutation("progress.post-one-quiz-result");
  const quizHintMutation = trpc.useMutation("post.getHint");
  const quizEfactorMutation = trpc.useMutation("progress.get-efactor");
  const [choice, setChoice] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);
  const [quizIndex, setQuizIndex] = useState<number>(0);

  const [startButtonVisibility, setStartButtonVisibility] = useState<boolean>(true);
  const [quizContentVisibility, setQuizContentVisibility] = useState<boolean>(false);

  var correctAnswerId = useRef<string>("");

  var arrayHints = useRef<string[]>([]);
  var arrayEfactors = useRef<number[]>([]);

  var imgVisibility = useRef(false);

  var quizStart = useRef(0);

  useEffect(() => {
    quiz.forEach(quiz => {
      quizHintMutation
        .mutateAsync({
          quizId: quiz.id,
        }).then((q: string) => {
          arrayHints.current.push(q);
        });

      quizEfactorMutation
        .mutateAsync({
          quizId: quiz.id,
        }).then((questionEfactor: number) => {
          arrayEfactors.current.push(questionEfactor);
        }
        );
    }
    );
  }, [])

  const forceUpdate = () => {
    if (quizIndex == quiz.length - 1) {
      setDone(true);
    }
    setQuizIndex(quizIndex + 1);
    setAttempted(false);
  }

  // TODO: measure grade based on time taken
  const getScoreBasedOnTimeTaken = (correct: boolean, timeTaken: number) => {
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
        return 1;
      }
    }
  }

  const handleSingleQuiz = (quiz: Quiz) => {
    const name = quiz.name;
    const options: Option[] = JSON.parse(quiz.options);
    const currentQuestionsEfactor = arrayEfactors.current[quizIndex];
    correctAnswerId.current = options?.map((op: Option) => {
      if (op.is_correct)
        return op.id;
    }) as unknown as string;
    // the array of correct answers; but I need only the first because the rest are undefined
    correctAnswerId.current = correctAnswerId.current[0] as string;
    if (currentQuestionsEfactor) {
      if (currentQuestionsEfactor > 2) {
        imgVisibility.current = false;
      } else {
        imgVisibility.current = true;
      }
    }

    if (quiz.type == QuizType.MCQ) {
      return <div className="flex">
        <FormControl component="fieldset">
          <FormLabel component="legend">{name}</FormLabel>
          {imgVisibility.current && <img id="hintImage" style={{ width: "200", height: "200" }} className="h-96"
            src={(arrayHints.current[quizIndex] == null) ? "" : arrayHints.current[quizIndex] as string}
            alt={'Hint could not be loaded/displayed at the URL: ' + arrayHints.current[quizIndex] as string} />}
          <RadioGroup
            value={choice}
            onChange={handleChange}
          >
            {options?.map((op, idx) => {
              return <FormControlLabel value={op.id} key={idx} control={<Radio />} label={op.desc} className={`bg-opacity-70 ${(choice == op.id) && (op.id != correctAnswerId.current) && attempted ? "bg-red-600" : (op.id == correctAnswerId.current) && attempted ? "bg-lime-500" : ""}`} onChange={e => { console.log("the op.id ", op.id) }
              } />
            })}
          </RadioGroup>
        </FormControl>
      </div>
    }
    else {
      throw new Error("TODO: Other types of quizzes are not yet supported");
    }
  };


  const handleChange = (e: any) => {
    setChoice(e.target.value as string);
    console.log("the correct id ", correctAnswerId.current);
  };

  const handleCheckAnswer = async () => {
    // Check correctness
    setAttempted(true);
    const options = JSON.parse(quiz[quizIndex]?.options as string);
    const correctChoiceId = options?.map((op: Option) => {
      if (op.is_correct) return op.id;
    }) as string[];
    let quizTimeTaken = performance.now() - quizStart.current;
    let score: number;

    if (correctChoiceId.includes(choice)) {
      score = getScoreBasedOnTimeTaken(true, quizTimeTaken);
      // TODO: change colour of the choices
    } else {
      score = getScoreBasedOnTimeTaken(false, quizTimeTaken);
    }

    // Post result
    quizPostMutation.mutateAsync({
      quizId: quiz[quizIndex]?.id as number,
      grade: score,
    });

  };

  const handleNextQuestion = async () => {
    forceUpdate();
  }

  return (
    <>
      <div className={`h-200 flex flex-col items-stretch microQuiz ${(done) ? "hidden" : ""}`}>
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            {
              startButtonVisibility &&
              <div className="flex flex-col items-center justify-center">
                <a className="relative inline-block text-lg group cursor-pointer" onClick={() => { setStartButtonVisibility(false); quizStart.current = performance.now(); }}>
                  <span className="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white">
                    <span className="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span>
                    <span className="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"></span>
                    <span className="relative">Start Quiz</span>
                  </span>
                  <span className="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0" data-rounded="rounded-lg"></span>
                </a>
              </div>
            }
            {
              !startButtonVisibility &&
              <div>
                <div className="flex flex-col items-center justify-center">
                  {
                    done ? <></> : handleSingleQuiz(quiz[quizIndex] as Quiz)
                  }
                </div>
                {
                  done ? <></> :
                    <div className="flex fljjex-wrap gap-3 justify-center">
                      {attempted ? <></> :
                        <button
                          onClick={() => {
                            handleCheckAnswer();
                          }}
                          className="py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
                        >
                          Check Answer
                        </button>}
                    </div>
                }
                {
                  attempted ? <div className="flex fljjex-wrap gap-3 justify-center">
                    <button
                      onClick={() => {
                        handleNextQuestion();
                      }}
                      className="py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
                    >
                      Next Question
                    </button>
                  </div> : <></>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizSection;
