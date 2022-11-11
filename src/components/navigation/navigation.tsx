import React, { useState, useEffect } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";

import RefreshIcon from "@mui/icons-material/Refresh";

import { TreeView, TreeItem } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  styled,
  TextField,
} from "@mui/material";

import { trpc } from "../../utils/trpc";

import {
  Convert,
  ContentTree,
  Domain,
  Skill,
  Concept,
  Question,
} from "@/utils/contentTreeInterface";

import create from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Option } from "@/utils/text";

interface ConceptState {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
  options: Option[];
}

const useConceptStore = create<ConceptState>()(
  devtools(
    persist(
      (set) => ({
        id: "",
        name: "",
        parentId: "",
        parentName: "",
        options: [],
      }),
      {
        name: "concept-storage",
      }
    )
  )
);

interface ConceptStateList {
  concepts: ConceptState[];
}

const useConceptListStore = create<ConceptStateList>()(
  devtools(
    persist(
      (set) => ({
        concepts: [],
      }),
      {
        name: "concept-list-storage",
      }
    )
  )
);

const TreeElement = styled("div")`
  display: flex;
  flex-direction: column;
`;

export type NavigationProps = {
  open?: boolean;
  onClose: () => void;
  addNodeToWorkspace: (
    nodeId: string,
    nodeName: string,
    parentId: string,
    parentName: string,
    options: Option[]
  ) => void;
  addNodeListToWorkspace: (concepts: ConceptState[]) => void;
  nodes?: Domain[];
  multiselect: boolean;
  questions: boolean;
};

interface DataTreeViewProps {
  treeItems: Domain[] | undefined;
  questions: boolean;
  multiselect: boolean;
}

function DataTreeView({
  treeItems,
  questions,
  multiselect,
}: DataTreeViewProps) {
  const getTreeQuestionsFromData = (
    treeItems: Question[],
    concept: Concept
  ) => {
    return treeItems.map((treeItemData) => {
      return (
        <TreeItem
          key={treeItemData.id}
          nodeId={treeItemData.id}
          label={treeItemData.desc}
          onClick={() => {
            useConceptStore.setState({
              id: treeItemData.id,
              name: treeItemData.desc,
              parentId: concept.id,
              parentName: concept.name,
              options: treeItemData.options
            });
          }}
        />
      );
    });
  };

  const getTreeConceptsFromData = (treeItems: Concept[]) => {
    //Clean useConceptListStore array
    useConceptListStore.setState({ concepts: [] });
    return treeItems.map((treeItemData) => {
      let children = undefined;
      if (questions === true) {
        if (treeItemData.questions && treeItemData.questions.length > 0) {
          children = getTreeQuestionsFromData(
            treeItemData.questions,
            treeItemData
          );
        }
        return (
          /* eslint-disable react/no-children-prop */
          <TreeItem
            key={treeItemData.id}
            nodeId={treeItemData.id}
            label={treeItemData.name}
            children={children}
          />
        );
      } else {
        return (
          <TreeItem
            key={treeItemData.id}
            nodeId={treeItemData.id}
            label={treeItemData.name}
            onClick={() => {
              useConceptListStore.setState({
                concepts: [
                  ...useConceptListStore.getState().concepts,
                  {
                    id: treeItemData.id,
                    name: treeItemData.name,
                    parentId: "",
                    parentName: "",
                    options: []
                  },
                ],
              });
              const concepts2 = useConceptListStore.getState().concepts;
              //print each concept2
            }}
          />
        );
      }
    });
  };
  const getTreeSkillsFromData = (treeItems: Skill[]) => {
    return treeItems.map((treeItemData) => {
      let children = undefined;
      if (treeItemData.concepts && treeItemData.concepts.length > 0) {
        children = getTreeConceptsFromData(treeItemData.concepts);
      }
      return (
        <TreeItem
          key={treeItemData.id}
          nodeId={treeItemData.id}
          label={treeItemData.name}
          /* eslint-disable react/no-children-prop */
          children={children}
        />
      );
    });
  };

  const getTreeItemsFromData = (treeItems: Domain[] | undefined) => {
    if (treeItems) {
      return treeItems.map((treeItemData) => {
        let children = undefined;
        if (treeItemData.skills && treeItemData.skills.length > 0) {
          children = getTreeSkillsFromData(treeItemData.skills);
        }
        return (
          <TreeItem
            key={treeItemData.id}
            nodeId={treeItemData.id}
            label={treeItemData.name}
            /* eslint-disable react/no-children-prop */
            children={children}
          />
        );
      });
    }

    return null;
  };
  const [selected, setSelected] = useState("");
  return (
    <div>
      <TreeView
        aria-label="multi-select"
        multiSelect
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
      >
        {getTreeItemsFromData(treeItems)}
      </TreeView>
    </div>
  );
}

const Navigation = ({
  open = false,
  onClose,
  addNodeToWorkspace,
  addNodeListToWorkspace,
  multiselect,
  questions,
}: NavigationProps) => {
  const [contentTree2, setContentTree2] = useState<ContentTree>();
  const [isLoading, setIsLoading] = useState(false);

  const getContentTreeMutation = trpc.useMutation("getContentTree.contentTree");
  const getContentTreeNoQMutation = trpc.useMutation(
    "getContentTree.contentTreeNoQ"
  );

  const handleContentTree = async () => {
    if (questions === true) {
      const created: ContentTree | undefined =
        await getContentTreeMutation.mutateAsync(
          {
            description: "test",
          },
          {
            onSuccess: (data) => {
              setContentTree2(data);
              setIsLoading(false);
            },
            onError: (error) => {
              console.log("error", error);
            },
          }
        );
    } else {
      // contenttree only returns the concepts/skills/domains with created content
      await getContentTreeNoQMutation.mutateAsync(
        {
          description: "test",
        },
        {
          onSuccess: (data) => {
            setContentTree2(data);
            setIsLoading(false);
          },
          onError: (error) => {
            console.log("error", error);
          },
        }
      );
    }
  };
  const id = useConceptStore((state) => state.id);
  const name = useConceptStore((state) => state.name);
  const parentId = useConceptStore((state) => state.parentId);
  const parentName = useConceptStore((state) => state.parentName);
  const options = useConceptStore((state) => state.options);
  //const concepts = useConceptListStore((state) => state.concepts);

  function getConcepts() {
    const concepts = useConceptListStore.getState().concepts;
    return concepts;
  }

  const handleOpen = async () => {
    if (open) {
      setIsLoading(true);
      useConceptStore.setState({
        id: "",
        name: "",
        parentId: "",
        parentName: "",
        options: [],
      });
      await handleContentTree();
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleOpen();
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ borderBottom: 1 }}>Navigation</DialogTitle>

      <DialogContent>
        <div className="App">
          <div className="flex justify-center items-center grid-cols-2">
            {isLoading && (
              <span className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
            )}
          </div>
          {!isLoading && contentTree2?.data && (
            <DataTreeView
              questions={questions}
              treeItems={contentTree2?.data.domains}
              multiselect={multiselect}
            />
          )}

          <br />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="error">
          Cancel
        </Button>
        <Button
          disabled={false} /* {id === ""} */
          className="disabled:text-gray-400 disabled:bg-gray-200`"
          /* disabled={!acronymGenerated || isLoadingAcronym[index]} */
          variant="outlined"
          color="success"
          style={{
            bottom: 0,
            float: "left",
            margin: 5,
          }}
          onClick={() => {
            if (multiselect) {
              addNodeListToWorkspace(getConcepts());
            } else {
              addNodeToWorkspace(id, name, parentId, parentName, options);
            }
            /* addNodeToWorkspace(id, name, parentId, parentName);
            addNodeListToWorkspace(concepts); */
            onClose();
          }}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// module.exports.Navigation = Navigation;

export default Navigation;
