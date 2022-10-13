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
} from "../../server/router/contentTreeInterface";

import create from "zustand";
import { devtools, persist } from "zustand/middleware";

interface ConceptState {
  id: string;
  name: string;
}

const useConceptStore = create<ConceptState>()(
  devtools(
    persist(
      (set) => ({
        id: "",
        name: "",
      }),
      {
        name: "concept-storage",
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
  addNodeToWorkspace: (nodeId: string) => void;
  nodes?: Domain[];
};

interface DataTreeViewProps {
  treeItems: Domain[] | undefined;
}

function DataTreeView({ treeItems }: DataTreeViewProps) {
  const conceptId = useConceptStore((state) => state.id);
  const conceptName = useConceptStore((state) => state.name);

  const getTreeQuestionsFromData = (treeItems: Question[]) => {
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
            });
          }}
        />
      );
    });
  };


  const getTreeConceptsFromData = (treeItems: Concept[]) => {
    return treeItems.map((treeItemData) => {
      let children = undefined;
      if (treeItemData.questions && treeItemData.questions.length > 0) {
        children = getTreeQuestionsFromData(treeItemData.questions);
      }
      return (
        <TreeItem
          key={treeItemData.id}
          nodeId={treeItemData.id}
          label={treeItemData.name}
          children={children}
        />
      );
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
            children={children}
          />
        );
      });
    }

    return null;
  };
  const [selected, setSelected] = useState("");
  const concept = useConceptStore((state) => state.id);
  return (
    <div>
      <TreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        selected={selected}
        onNodeSelect={(e: any, nodeId: React.SetStateAction<string>) => {
          // if nodeid is a string
          if (Array.from(nodeId)[0] === "C") {
            useConceptStore.setState({ id: nodeId?.toString() });
          } else {
            useConceptStore.setState({ id: null });
          }
        }}
      >
        {getTreeItemsFromData(treeItems)}
      </TreeView>
    </div>
  );
}

const Navigation = ({
  nodes = [],
  open = false,
  onClose,
  addNodeToWorkspace,
}: NavigationProps) => {
  const [bookNodes, setBookNodes] = useState(<TreeView></TreeView>);
  const [contentTree2, setContentTree2] = useState<ContentTree>();
  const [isLoading, setIsLoading] = useState(false);

  const getContentTreeMutation = trpc.useMutation("getContentTree.contentTree");

  const handleContentTree = async () => {
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
  };
  const id = useConceptStore((state) => state.id);
  const name = useConceptStore((state) => state.name);
  console.log(id);

  const handleOpen = async () => {
    if (open) {
      setIsLoading(true);
      await handleContentTree();
      setIsLoading(false);
    }
  }

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
            <DataTreeView treeItems={contentTree2?.data.domains} />
          )}

          <br />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="error">
          Cancel
        </Button>
        <Button
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
            addNodeToWorkspace(name);
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
