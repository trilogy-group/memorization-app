import React, { useState, useEffect } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
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

import { Convert, ContentTree, Domain } from "../../server/router/contentTreeInterface";

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

export function Navigation({
  nodes = [],
  open = false,
  onClose,
  addNodeToWorkspace,
}: NavigationProps) {
  const [selected, setSelected] = useState("");
  const nodeMap = {};
  const [standardNodes, setStandardNodes] = useState(<TreeView></TreeView>);
  const [bookNodes, setBookNodes] = useState(<TreeView></TreeView>);
  const [conceptNodes, setConceptNodes] = useState(<TreeView></TreeView>);

  const getContentTreeMutation = trpc.useMutation("getContentTree.contentTree");

  const handleContentTree = async () => {
    const created: ContentTree = await getContentTreeMutation.mutateAsync({
      description: "test",
    });
    return created
    console.log(created.data.domains[0]?.name);
  };

  // Creating a frequency dictionary
  const visitedDictionary = {};
  const labelNodes = {};

  nodes.forEach((node) => {
    visitedDictionary[node["id"]] = 0;
    nodeMap[node["id"]] = node;
    if (!(node.data.kind in labelNodes)) {
      labelNodes[node.data.kind] = [];
    }
    labelNodes[node.data.kind].push(node);
  });

  const setTreeView = (nds: Domain[]) => {
    const conceptNodes = (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <LocalActivityIcon />
        <TreeItem nodeId={"main_concept"} label={"Concepts"}>
          {listSpecificNodes(
            nds,
            ["contains", "implements"],
            ["Domain", "Cluster", "Concept"],
            ["Concept"]
          )}
        </TreeItem>
      </div>
    );

    const revisit_these = ["Domain", "Cluster", "Standard"];

    nodes.forEach((node) => {
      if (revisit_these.includes(node.data.kind)) {
        visitedDictionary[node.id] = 0;
      }
    });

    const standardNodes = (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <AccountBalanceIcon />
        <TreeItem nodeId={"main_standard"} label={"Coherence Map"}>
          {listSpecificNodes(
            nds,
            ["contains"],
            ["Domain", "Cluster", "Standard"],
            ["Standard"]
          )}
        </TreeItem>
      </div>
    );

    const bookNodes = (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <MenuBookIcon />
        <TreeItem nodeId={"main_book"} label={"Books"}>
          {listSpecificNodes(
            nds,
            ["*"],
            [
              "Book",
              "Chapter",
              "Section",
              "SubSection",
              "Prerequisite",
              "LearningResources",
              "Link",
              "Exercise",
              "Introduction",
              "Problem",
              "Example",
              "KeyTerm",
              "Note",
              "HowTo",
              "EveryDayMaths",
              "TryIt",
              "PracticeTest",
              "WritingExersises",
              "ReviewExercises",
            ],
            ["*"]
          )}
        </TreeItem>
      </div>
    );

    setBookNodes(bookNodes);
    setConceptNodes(conceptNodes);
    setStandardNodes(standardNodes);
  };
  
  const handleInput = async (e) =>  {
    let searchedNodes: Domain[] = [];
    const content = await handleContentTree();
    content.data.domains.forEach((domain: Domain) => {
      let searched = e.target.value.toLowerCase();
      // This will be edited upon change in nomenclature
      if (domain.name) {
        let node_name = domain.name;
        if (node_name.includes(searched)) {
          searchedNodes.push(domain);
        }
      }
    });

    setTreeView(searchedNodes);
  };

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
  };

  // Recursive function to display all nodes of type nodeKinds that are linked only through these specified edgeKinds and contains one of these leafNodes.
  const listChildren = (
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
  };

  useEffect(() => {
    setTreeView(nodes);
  }, []);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ borderBottom: 1 }}>Navigation</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          size="small"
          sx={{ my: 2 }}
          label="Search"
          onChange={handleInput}
        />

        <TreeView
          aria-label="Knowledge Graph Hierarchical view"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          selected={selected}
          onNodeSelect={(e, nodeId) => setSelected(nodeId)}
          sx={{
            height: 240,
            width: 400,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {bookNodes}
          {conceptNodes}
          {standardNodes}
        </TreeView>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cancel
        </Button>
        <Button
          onClick={() => {
            handleContentTree();
          }}
          variant="contained"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
