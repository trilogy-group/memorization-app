import { supermemo } from "supermemo";

/*
getRepetitionProgress(item: SuperMemoItem, grade: SuperMemoGrade): SuperMemoItem
    item
        repetition: the number of continous correct responses. The initial repetition value should be 0.
        interval: inter-repetition interval after the repetitions (in days). The initial interval value should be 0.
        efactor: easiness factor reflecting the easiness of memorizing and retaining a given item in memory. The initial efactor value should be 2.5.
    grade:
        5: perfect response.
        4: correct response after a hesitation.
        3: correct response recalled with serious difficulty.
        2: incorrect response; where the correct one seemed easy to recall.
        1: incorrect response; the correct one remembered.
        0: complete blackout.
    e.g.,
        let item: SuperMemoItem = {
          interval: 0,
          repetition: 0,
          efactor: 2.5,
        };
*/

export type SuperMemoItem = {
  interval: number;
  repetition: number;
  efactor: number;
};

type SuperMemoGrade = 0 | 1 | 2 | 3 | 4 | 5;


export const getRepetition = (
  item: SuperMemoItem,
  grade: SuperMemoGrade,
): Promise<SuperMemoItem> => {
  const newitem = supermemo(item, grade);
  return new Promise(async () => {
    return newitem
  });
};

export const newRepetition = (
  grade: SuperMemoGrade,
): SuperMemoItem => {
  let item: SuperMemoItem = {
    interval: 0,
    repetition: 0,
    efactor: 2.5,
  };
  const newitem = supermemo(item, grade);

  return newitem
};
