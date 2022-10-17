import { Quiz } from "@prisma/client";
import { useEffect, useRef, useState, FC } from "react";
import { trpc } from "@/utils/trpc";
import React from "react";
import { useSession } from "next-auth/react";
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import { QuizType, Option } from "@/utils/text";
import toast from "react-hot-toast";


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
  const quizGetHint = trpc.useMutation("post.getHint");
  const quizGetEfactor = trpc.useMutation("progress.get-efactor");
  const [choice, setChoice] = useState<string>("");
  const [done, setDone] = useState<boolean>(false);
  const [attempted, setAttempted] = useState<boolean>(false);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [hintImageVisibility, setHintImageVisibility] = useState(true);

  var arrayHints = useRef<string[]>([]);
  var arrayEfactors = useRef<number[]>([]);

  if (quiz == null || quiz.length == 0) {
    return <>No Quiz now</>;
  }

  useEffect(() => {

    // getting hints (coverURLs) into arrayHints
    quiz.forEach(quiz => quizGetHint
      .mutateAsync({
        quizId: quiz.id,
      }).then(questionHint => {
        console.log(questionHint.coverURL as string),
          arrayHints.current.push(questionHint.coverURL)
      }
      )
      .catch(err => toast(err)));

    // getting efactors into arrayEfactors
    quiz.forEach(quiz => quizGetEfactor
      .mutateAsync({
        quizId: quiz.id,
      }).then(questionEfactor => {
        if (questionEfactor) {
          arrayEfactors.current.push(questionEfactor);
        }
      }
      )
      .catch(err => toast(err)));
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
        return 0;
      }
    }
  }

  const handleSingleQuiz = (quiz: Quiz) => {
    const name = quiz.name;
    const options: Option[] = JSON.parse(quiz.options);
    const currentQuestionsEfactor = arrayEfactors.current[quizIndex];

    if (currentQuestionsEfactor) {
      if (currentQuestionsEfactor > 2) {
        setHintImageVisibility(false);
      } else {
        setHintImageVisibility(true);
      }
    }

    if (quiz.type == QuizType.MCQ) {
      return <div className="flex">
        <FormControl component="fieldset">
          <FormLabel component="legend">{name}</FormLabel>
          {hintImageVisibility && <img id="hintImage" style={{ width: "200", height: "200" }} src={(arrayHints.current[quizIndex] == null) ? "" : arrayHints.current[quizIndex] as string} alt={`Hint could not be loaded/displayed at the URL:  ${arrayHints.current[quizIndex]}`} />}
          <RadioGroup
            value={choice}
            onChange={handleChange}
          >
            {options?.map((op, idx) => {
              return <FormControlLabel value={op.id} key={idx} control={<Radio />} label={op.desc} />;
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
  };

  const handleCheckAnswer = async () => {
    // Check correctness
    setAttempted(true);
    const options = JSON.parse(quiz[quizIndex]?.options as string);
    const correctChoiceId = options?.map((op: Option) => {
      if (op.is_correct) return op.id;
    }) as string[];
    if (correctChoiceId.includes(choice)) {
      console.log('Correct!');
      // TODO: change colour of the choices
    } else {
      console.log('wrong, answer is ' + choice);
    }
    // Post result
    quizPostMutation.mutateAsync({
      quizId: quiz[quizIndex]?.id as number,
      grade: correctChoiceId.includes(choice) ? 5 : 1,
    });
  };

  const handleNextQuestion = async () => {
    forceUpdate();
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-stretch microQuiz">
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
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
        </div>
      </div>
    </>
  );
};

export default QuizSection;
