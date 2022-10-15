import { Quiz } from "@prisma/client";
import { useEffect, useRef, useState, FC } from "react";
import { trpc } from "@/utils/trpc";
import React from "react";
import { useSession } from "next-auth/react";
import { FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import { QuizType } from "@/utils/text";

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
  const [choice, setChoice] = useState<string>("");
  let quizIndex = 0;

  if (quiz == null || quiz.length == 0) {
    return <>No Quiz now</>;
  }

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

  interface Option {
    id: string,
    desc: string,
    ordinal: string,
    is_correct: boolean,
  }

  const handleSingleQuiz = (quiz: Quiz) => {
    const name = quiz.name;
    const answer = quiz.answer;
    console.log(quiz.options);
    const options: Option[] = JSON.parse(quiz.options);

    if (quiz.type == QuizType.MCQ) {
      return <div className="flex">
        <FormControl component="fieldset">
          <FormLabel component="legend">{name}</FormLabel>
          <RadioGroup
            value={choice}
            onChange={handleChange}
          >
            {options.map((op, idx) => {
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
    console.log('handlechange', e.target.value);
    setChoice(e.target.value as string);
  };

  const handleCheckAnswer = async () => {
    // Check correctness

    // Post result
    await quizPostMutation.mutateAsync({
      quizId: quiz[quizIndex]?.id as number,
      grade: 5,
    });
    quizIndex += 1;
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-stretch microQuiz">
        <div className="flex justify-center mx-2 flex-grow bg-white-1">
          <div className="w-full max-w-[1000px] p-8 bg-white my-4">
            <div className="flex flex-col items-center justify-center">
              {handleSingleQuiz(quiz[quizIndex] as Quiz)}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                disabled={choice == "" && quizIndex < quiz.length}
                onClick={() => {
                  handleCheckAnswer();
                }}
                className="py-3 min-w-[170px] border border-gray-2 bg-white hover:bg-gray-100 transition"
              >
                Check Answer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizSection;
