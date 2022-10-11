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
} from "../../server/router/contentTreeInterface";

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
  const getTreeConceptsFromData = (treeItems: Concept[]) => {
    return treeItems.map((treeItemData) => {
      return (
        <TreeItem
          key={treeItemData.id}
          nodeId={treeItemData.id}
          label={treeItemData.name}
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

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {getTreeItemsFromData(treeItems)}
    </TreeView>
  );
}

const Navigation = ({
  nodes = [],
  open = false,
  onClose,
  addNodeToWorkspace,
}: NavigationProps) => {
  const [selected, setSelected] = useState("");
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
  /*
  const listSpecificNodes = (
    specifiedNodes: Domain[],
    edgeKinds: string[],
    nodeOrder: string[],
    leafNodes: string[]
  ) => {
    const returnedChildren: JSX.Element[] = [];

    nodeOrder.forEach((order) => {
      if (labelNodes[order]) {
        labelNodes[order].forEach((node) => {
          if (
            specifiedNodes.includes(node) &&
            visitedDictionary[node.id] === 0
          ) {
            visitedDictionary[node.id]++;
            const [children, leafNodePresent] = listChildren(
              node.id,
              edgeKinds,
              nodeOrder,
              leafNodes
            );
            const isALeafNode =
              leafNodes.includes(node.data.kind) || leafNodes.includes("*");
            if (leafNodePresent || isALeafNode) {
              var name = node.data.label;
              name +=
                node.data.kind === "Domain" ? ` [${node.data.grade}]` : "";
              name = name.replace(/<[^>]*>?/gm, "");
              returnedChildren.push(
                <TreeElement>
                  <TreeItem nodeId={node.id} label={name}>
                    {children}
                  </TreeItem>
                </TreeElement>
              );
            }
          }
        });
      }
    });
    return returnedChildren;
  };*/

  // Recursive function to display all nodes of type nodeKinds that are linked only through these specified edgeKinds and contains one of these leafNodes.
  /*const listChildren = (
    nodeId: string,
    edgeKinds,
    nodeKinds: string[],
    leafNodes: string[]
  ): [JSX.Element[], number] => {
    const returnedChildren: JSX.Element[] = [];
    let isLeafNodePresent: number = leafNodes.includes("*") ? 1 : 0;

    edges
      .filter((edge) => edge.source === nodeId)
      .filter(
        (edge) => edgeKinds.includes(edge.label) || edgeKinds.includes("*")
      )
      .forEach((edge) => {
        if (visitedDictionary[edge.target] === 0) {
          visitedDictionary[edge.target]++;
          const [children, leafNodePresent] = listChildren(
            edge.target,
            edgeKinds,
            nodeKinds,
            leafNodes
          );
          const isALeafNode =
            leafNodes.includes(nodeMap[edge.target].data.kind) ||
            leafNodes.includes("*");
          if (leafNodePresent || isALeafNode) {
            isLeafNodePresent = 1;
            if (nodeKinds.includes(nodeMap[edge.target].data.kind)) {
              returnedChildren.push(
                <TreeElement>
                  <TreeItem
                    nodeId={edge.target}
                    label={nodeMap[edge.target].data.label}
                  >
                    {children}
                  </TreeItem>
                </TreeElement>
              );
            } else {
              returnedChildren.push(<TreeElement>{children}</TreeElement>);
            }
          }
        }
      });
    return [returnedChildren, isLeafNodePresent];
  };*/
  //setBookNodes(await handleBookNodes());

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ borderBottom: 1 }}>Navigation</DialogTitle>

      <DialogContent>
        {/* <TextField
          fullWidth
          size="small"
          sx={{ my: 2 }}
          label="Search"
          onChange={handleInput}
        /> */}
        <Button
          className="disabled:text-gray-400 disabled:bg-gray-200`"
          onClick={async () => {
            setIsLoading(true)
            await handleContentTree();
            setIsLoading(false)
          }}
          variant="outlined"
          color="error"
          style={{
            bottom: 0,
            float: "right",
            margin: 5,
          }}
        >
          {" "}
          <RefreshIcon />
        </Button>
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
        <Button onClick={onClose} variant="contained">
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
          /* onClick={async () => {
            setSelectedMnemonicType(acronym[index]);
            setSelectedMnemonic(true);
          }} */
        >
          Accept
        </Button>
        <Button
          onClick={async () => {
            await handleContentTree();
          }}
          variant="contained"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
// module.exports.Navigation = Navigation;

export default Navigation;
