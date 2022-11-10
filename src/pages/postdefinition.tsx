import type { GetServerSideProps, NextPage } from "next";
import { Textarea } from "@nextui-org/react";
import Link from "next/link";

import { AiOutlinePlus } from "react-icons/ai";

import { unstable_getServerSession as getServerSession } from "next-auth";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Navbar from "@/components/Layout/Navbar";
import Meta from "@/components/Shared/Meta";

import { trpc } from "../utils/trpc";
import { authOptions } from "./api/auth/[...nextauth]";
import { borderRadius } from "@mui/system";
import { getSystemErrorMap } from "util";
import { table } from "console";

import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Unstable_Grid2";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import TextareaAutosize from "@mui/material/TextareaAutosize";

import Button from "@mui/material/Button";

import RefreshIcon from "@mui/icons-material/Refresh";
import BackIcon from "@mui/icons-material/ArrowBackIosNew";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";

import Navigation from "../components/navigation/navigation";
import Upload from "../components/upload/upload";

import { Option } from "@/utils/text";

import { nanoid } from "nanoid";

interface ConceptState {
  id: string;
  name: string;
  parentId: string;
  parentName: string;
}

enum TabOptions {
  Acronym = 1,
  Image,
  Story,
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: 200,
  overflow: "hidden",
}));

const Item2 = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  textAlign: "center",
  color: theme.palette.text.secondary,
  height: 420,
  overflow: "hidden",
}));

const wordList: string[] = [];

const CreateListOfWords: NextPage = () => {
  const [openUpload, setOpenUpload] = useState(false);

  const uploadMutation = trpc.useMutation("post.createVideo");

  const uploadImageMutation = trpc.useMutation("post.uploadToS3");

  const [mnemonicImage, setMnemonicImage] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);

  const [story, setStory] = useState<string[]>([]);

  const imgRecommendationMutation = trpc.useMutation("recommendImg.stabledif");
  const storyRecommendationMutation = trpc.useMutation("recommendStory.story");
  const promptRecommendationMutation = trpc.useMutation(
    "recommendStory.prompt"
  );

  const [inputValue, setInputValue] = useState("");
  const [inputPromptValue, setInputPromptValue] = useState("");
  const [inputPostValue, setInputPostValue] = useState("");

  const [tableEntryValue, setTableEntryValue] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);

  const [isLoadingImage, setIsLoadingImage] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  const [isLoadingAcronym, setIsLoadingAcronym] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  const [isLoadingStory, setIsLoadingStory] = useState<boolean[]>([
    false,
    false,
    false,
    false,
  ]);

  const [value, setValue] = useState("2");
  const [storyGenerated, setStoryGenerated] = useState(false);
  const [acronymGenerated, setAcronymGenerated] = useState(false);
  const [imageGenerated, setImageGenerated] = useState(false);

  const [selectedMnemonic, setSelectedMnemonic] = useState(false);
  const [selectedMnemonicType, setSelectedMnemonicType] = useState("");

  const [options, setOptions] = useState([]);

  const [open, setOpen] = useState(false);

  const [nodeId, setNodeId] = useState("");
  const [nodeName, setNodeName] = useState("");
  const [parentId, setParentId] = useState("");
  const [parentName, setParentName] = useState("");
  const [mnemonicType, setMnemonicType] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  const [generating, setGenerating] = useState(false);

  const features = ["happy", "funny", "drawing", "scary"];

  const handleChange = async (
    event: React.SyntheticEvent,
    newValue: string
  ) => {
    setValue(newValue);
    const value = Number(newValue);
    if (
      value === TabOptions.Story &&
      !storyGenerated &&
      wordList.length > 0 &&
      generating
    ) {
      handleRecommeddedStoryList(tableEntryValue);
      setStoryGenerated(true);
    } else if (
      value === TabOptions.Image &&
      !imageGenerated &&
      wordList.length > 0
    ) {
      handleRecommenddedPrompt();
      setImageGenerated(true);
    }
  };

  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);

  const handleRecommeddedImage = async (index: Number, prompt: string) => {
    let newLoading = isLoadingImage;
    newLoading[Number(index)] = true;
    setIsLoadingImage((prevLoading) => [...newLoading]);

    const featurePrompt = prompt + " " + features[Number(index)];

    const created = await imgRecommendationMutation.mutateAsync({
      description: featurePrompt,
    });
    const imageRoute = created?.filename as string;
    const s3ImageURL = await handleUploadToS3(imageRoute);

    let prevMnemonicImage = mnemonicImage;

    prevMnemonicImage[Number(index)] = s3ImageURL as string;
    setMnemonicImage(prevMnemonicImage);

    newLoading = isLoadingImage;
    newLoading[Number(index)] = false;
    setIsLoadingImage((prevLoading) => [...newLoading]);
  };

  const handleRecommenddedPrompt = async () => {
    setIsLoading(true);
    const promptCreated = await promptRecommendationMutation.mutateAsync({
      description: correctAnswer,
    });
    setIsLoading(false);
    const prompt = String(promptCreated?.result);
    const sprompt = ltrim((prompt || "") as string);
    setInputPromptValue(sprompt);
    //await handleRecommeddedImageList(sprompt);
  };

  function ltrim(str: string) {
    if (!str) return str;
    return str.replace(/^\s+/g, "");
  }

  const handleUploadToS3 = async (file: string) => {
    const res = await uploadImageMutation.mutateAsync({ file: file });
    return res;
  };

  const handleRecommeddedImageList = async (prompt: string) => {
    let prevLoading = isLoadingImage;
    let prevMnemonicImage = mnemonicImage;
    for (let i = 0; i < 4; i++) {
      prevLoading[i] = true;
      setIsLoadingImage(prevLoading);
      prevMnemonicImage[i] = "";
      setMnemonicImage(prevMnemonicImage);
    }

    for (let i = 0; i < 4; i++) {
      prevLoading = isLoadingImage;
      prevLoading[Number(i)] = true;
      setIsLoadingImage(prevLoading);
      const featurePrompt = prompt + " " + features[i];

      const imageName = await imgRecommendationMutation.mutateAsync({
        description: featurePrompt,
      });
      const imageRoute = imageName?.filename as string;
      const s3ImageURL = await handleUploadToS3(imageRoute);

      prevMnemonicImage = mnemonicImage;
      prevMnemonicImage[i] = s3ImageURL as string;
      setMnemonicImage(prevMnemonicImage);

      prevLoading = isLoadingImage;
      prevLoading[Number(i)] = false;
      setIsLoadingImage(prevLoading);
    }
  };

  const handleRecommeddedStory = async (index: Number) => {
    let prevLoading = [false, false, false, false];

    prevLoading[Number(index)] = true;
    setIsLoadingStory(prevLoading);

    setIsLoadingMnemonic(true);
    var storyWordList = "";

    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        if (i == wordList.length - 1) {
          storyWordList += wordList[i];
        } else {
          storyWordList += wordList[i] + ", ";
        }
      }
    }
    const storyCreated = await storyRecommendationMutation.mutateAsync({
      description: storyWordList,
    });

    let prevStory = story;
    prevStory[Number(index)] = storyWordList + ": " + storyCreated?.result;
    setIsLoadingMnemonic(false);
    prevLoading = isLoadingStory;
    prevLoading[Number(index)] = false;
    setIsLoadingStory(prevLoading);
  };

  const handleRecommeddedStoryList = async (prompt: string) => {
    let prevLoading = isLoadingStory;
    for (let i = 0; i < 4; i++) {
      prevLoading[i] = true;
      setIsLoadingStory(prevLoading);
    }
    setIsLoadingMnemonic(true);
    var storyWordList = "";

    //Get first leter for each word in wordList

    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        if (i == wordList.length - 1) {
          storyWordList += wordList[i];
        } else {
          storyWordList += wordList[i] + ", ";
        }
      }
    }
    setStory(() => []);
    for (let i = 0; i < 4; i++) {
      prevLoading = isLoadingStory;
      prevLoading[Number(i)] = true;
      setIsLoadingStory(prevLoading);

      const storyCreated = await storyRecommendationMutation.mutateAsync({
        description: prompt,
      });
      setStory((prevStory) => [
        ...prevStory,
        prompt + ": " + String(storyCreated?.result),
      ]);

      prevLoading = isLoadingStory;
      prevLoading[Number(i)] = false;
      setIsLoadingStory(prevLoading);
    }
    setIsLoadingMnemonic(false);
  };

  const handleUpload = async () => {
    setOpenUpload(true); // TODO: connect to the mnemonics generation backend
  };

  const handleGeneration = async () => {
    setGenerating(true);
    const tab = Number(value);
    if (tab === TabOptions.Story) {
      handleRecommeddedStoryList(inputPromptValue);
      setStoryGenerated(true);
      setImageGenerated(false);
    } else if (tab === TabOptions.Image) {
      handleRecommeddedImageList(inputPromptValue);
      setImageGenerated(true);
      setStoryGenerated(false);
    }
  };

  const handleDelete = async (id: string) => {
    setGenerating(false);
    const index = options.findIndex((item: any) => item.id === id);
    if (index > -1) {
      options.splice(index, 1);
      await wordList.splice(index, 1);
      setOptions((state) => [...state]);
    }
    const tab = Number(value);
    return;
  };

  return (
    <>
      <Meta
        title="Post Mnemonics | EdTok"
        description="Post Mnemonics"
        image="/favicon.png"
      />
      <div className="min-h-screen flex flex-col items-stretch">
        <Navbar />

        <div className="flex justify-center mx-2 flex-grow place-items-center">
          <div className="w-full max-w-[1000px] p-1 bg-white my-1">
            <div className="flex items-start mt-10 gap-4">
              <div className="grid grid-cols-2 gap-11 p-2 w-[100%] mt-5 mb-2">
                <div className="col-span-1 w-full">
                  <h1 className="text-2xl font-bold">
                    Memorize a definition{" "}
                    <Navigation
                      open={open}
                      onClose={() => {
                        setOpen(false);
                      }}
                      multiselect={false}
                      questions={true}
                      addNodeToWorkspace={function (
                        nodeId: string,
                        nodeName: string,
                        parentId: string,
                        parentName: string,
                        questionOptions: Option[]
                      ): void {
                        setNodeId(nodeId);
                        setNodeName(nodeName);
                        setParentId(parentId);
                        setParentName(parentName);
                        setInputPostValue(nodeName);
                        const correctChoiceDesc = questionOptions?.map(
                          (op: Option) => {
                            if (op.is_correct) return op.desc;
                          }
                        ) as string[];
                        let correctOption = correctChoiceDesc.filter(
                          (option) => option !== undefined
                        )[0];
                        if (correctOption) {
                          setCorrectAnswer(correctOption);
                          setInputPromptValue(correctOption);
                        }
                      }}
                      addNodeListToWorkspace={function (
                        concepts: ConceptState[]
                      ): void {
                        throw new Error("Function not implemented.");
                      }}
                    />
                    {mnemonicType === "image" && (
                      <Upload
                        open={openUpload}
                        onClose={() => setOpenUpload(false)}
                        conceptId={parentId}
                        questionId={nodeId}
                        caption={nodeName + "\n Answer: " + correctAnswer}
                        mnemonicType={mnemonicType}
                        imageUrl={selectedMnemonicType}
                        mnemonicText=""
                      />
                    )}
                    {mnemonicType !== "image" && (
                      <Upload
                        open={openUpload}
                        onClose={() => setOpenUpload(false)}
                        conceptId={parentId}
                        questionId={nodeId}
                        caption={nodeName + "\n Answer: " + correctAnswer}
                        mnemonicType={mnemonicType}
                        imageUrl={""}
                        mnemonicText={selectedMnemonicType}
                      />
                    )}
                  </h1>

                  <div className="grid gap-1" style={{ marginBottom: 10 }}>
                    <button
                      className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                      style={{ borderRadius: 5, padding: 5, width: 200 }}
                      onClick={() => setOpen(true)}
                    >
                      Select content
                    </button>
                    {parentName != "" && (
                      <div>
                        <h3 className="text-lg font-bold">
                          Selected content: {parentName}
                        </h3>
                      </div>
                    )}
                    <Textarea
                      label="Enter your question"
                      placeholder="e.g., world leaders during WW2"
                      value={inputPostValue}
                      onChange={(e) => {
                        setInputPostValue(e.target.value);
                      }}
                    />
                  </div>
                  {correctAnswer != "" && (
                    <div>
                      <h3 className="text-lg font-bold">
                        Answer:
                        <Box
                          component="div"
                          sx={{
                            display: "inline",
                            p: 1,
                            m: 5,
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "#101010"
                                : "#fff",
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "grey.300"
                                : "grey.800",
                            border: "1px solid",
                            borderColor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "grey.800"
                                : "grey.300",
                            borderRadius: 2,
                            fontSize: "0.875rem",
                            fontWeight: "700",
                          }}
                        >
                          {correctAnswer}
                        </Box>
                      </h3>
                    </div>
                  )}
                  <div className="">
                    
                    {value == "2" && (
                      <TextareaAutosize
                        aria-label="empty textarea"
                        placeholder="Prompt for image generation"
                        value={inputPromptValue}
                        onChange={(e) => {
                          setInputPromptValue(e.target.value);
                        }}
                        style={{
                          width: "68%",
                          marginBottom: 10,
                          marginTop: 10,
                          padding: 5,
                        }}
                      />
                    )}

                    {value == "3" && (
                      <TextareaAutosize
                        aria-label="empty textarea"
                        placeholder="Prompt for story generation"
                        value={inputPromptValue}
                        onChange={(e) => {
                          setInputPromptValue(e.target.value);
                        }}
                        style={{
                          width: "68%",
                          marginBottom: 10,
                          marginTop: 10,
                          padding: 5,
                        }}
                      />
                    )}
                      <button
                        onClick={async () => {
                          setIsLoadingMnemonic(true);
                          await handleGeneration();
                          setIsLoadingMnemonic(false);
                        }}
                        disabled={!inputPromptValue.trim()}
                        className={`flex justify-center items-center gap-2 py-3 hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                        style={{
                          borderRadius: 10,
                          padding: 5,
                          width: "28%",
                          height: 38,
                          marginLeft: 10,
                          marginTop: 10,
                          float: "right",
                        }}
                      >
                        Generate
                      </button>
                    <div>
                    <Button
                          className="disabled:text-gray-400 disabled:bg-gray-200`"
                          disabled={correctAnswer == null || isLoading}
                          variant="outlined"
                          color="success"
                          style={{
                            bottom: 0,
                            float: "left",
                            margin: 5,
                          }}
                          onClick={async () => {
                            handleRecommenddedPrompt();
                          }}
                        >
                          {isLoading && (
                            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                          )}
                          Generate new prompt
                        </Button>
                    </div>
                    <div className="my-8 min-h-[200px]">
                      <ul id="answer">
                        {options.map((option: any, index) => {
                          return (
                            <li
                              key={index}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: 10,
                                border: "1px solid #ccc",
                                borderRadius: 5,
                                marginBottom: 5,
                              }}
                            >
                              <p>{index + 1 + ".- " + option.title}</p>
                              <button
                                onClick={() => {
                                  handleDelete(option.id);
                                }}
                                className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                                style={{ borderRadius: 5, padding: 5 }}
                              >
                                <DeleteIcon />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={async () => await handleUpload()}
                      disabled={
                        isLoading || !selectedMnemonic || parentName === ""
                      }
                      className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                      style={{
                        borderRadius: 10,
                        padding: 5,
                        height: 38,
                        marginTop: 10,
                        marginLeft: 10,
                        marginBottom: 10,
                      }}
                    >
                      {isLoading && (
                        <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                      )}
                      Post
                    </button>
                  </div>
                </div>

                {selectedMnemonic != null && !selectedMnemonic && (
                  <div className="col-span-1 h-full w-full">
                    <TabContext value={value}>
                      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <TabList
                          onChange={handleChange}
                          aria-label="lab API tabs example"
                        >
                          <Tab
                            label="Images"
                            value="2"
                            disabled={selectedMnemonic}
                          />
                          <Tab
                            label="Storys"
                            value="3"
                            disabled={selectedMnemonic}
                          />
                        </TabList>
                      </Box>
                      <TabPanel value="2">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          {Array.from(Array(4)).map((_, index) => (
                            <Grid xs={4} sm={6} md={6} key={index}>
                              <Item>
                                <div className="flex justify-center items-center grid-cols-1">
                                  {isLoadingImage[index] && (
                                    <span className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                                  )}
                                </div>

                                {!mnemonicImage[index] ? (
                                  <div className="col-span-1 bg-gray-1 h-full w-full"></div>
                                ) : (
                                  <div className="col-span-1 bg-gray-1 h-full w-full">
                                    {!isLoadingImage[index] && (
                                      <div className="col-span-1 bg-gray-1 h-full w-full">
                                        <img
                                          className="h-full w-auto object-contain"
                                          src={mnemonicImage[index]}
                                          alt=""
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Item>
                              <Button
                                disabled={
                                  isLoadingImage[index] ||
                                  mnemonicImage[index] == ""
                                }
                                variant="outlined"
                                color="success"
                                style={{
                                  bottom: 0,
                                  float: "left",
                                  margin: 5,
                                }}
                                onClick={async () => {
                                  setSelectedMnemonic(true);
                                  setSelectedMnemonicType(
                                    mnemonicImage[index] || ""
                                  );
                                  setMnemonicType("image");

                                  setSelectedMnemonic(true);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                disabled={
                                  isLoadingImage[index] ||
                                  mnemonicImage[index] == ""
                                }
                                onClick={async () => {
                                  await handleRecommeddedImage(
                                    index,
                                    tableEntryValue
                                  );
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
                            </Grid>
                          ))}
                        </Grid>
                      </TabPanel>
                      <TabPanel value="3">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          {Array.from(Array(4)).map((_, index) => (
                            <Grid xs={4} sm={6} md={6} key={index}>
                              <Item>
                                <div className="flex justify-center items-center grid-cols-2">
                                  {!isLoadingStory[index] && story[index]}
                                </div>

                                <div className="flex justify-center items-center">
                                  {isLoadingStory[index] && (
                                    <span className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                                  )}
                                </div>
                              </Item>
                              <Button
                                className="disabled:text-gray-400 disabled:bg-gray-200`"
                                disabled={
                                  !storyGenerated || isLoadingStory[index]
                                }
                                variant="outlined"
                                color="success"
                                style={{
                                  bottom: 0,
                                  float: "left",
                                  margin: 5,
                                }}
                                onClick={async () => {
                                  setMnemonicType("story");
                                  setSelectedMnemonicType(story[index] || "");
                                  setSelectedMnemonic(true);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                className="disabled:text-gray-400 disabled:bg-gray-200`"
                                disabled={
                                  !storyGenerated || isLoadingStory[index]
                                }
                                onClick={async () => {
                                  await handleRecommeddedStory(index);
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
                            </Grid>
                          ))}
                        </Grid>
                      </TabPanel>
                    </TabContext>
                  </div>
                )}
                {selectedMnemonic != null && selectedMnemonic && (
                  <div className="col-span-1 h-full w-full">
                    <TabContext value={value}>
                      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <TabList
                          disabled={true}
                          aria-label="lab API tabs example"
                        >
                          <Tab
                            label="Images"
                            value="2"
                            disabled={selectedMnemonic}
                          />
                          <Tab
                            label="Storys"
                            value="3"
                            disabled={selectedMnemonic}
                          />
                        </TabList>
                      </Box>
                      <TabPanel value="2">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          <Grid xs={4} sm={6} md={12}>
                            <Item2>
                              <div className="col-span-1 bg-gray-1 h-full w-full">
                                <img
                                  className="h-full w-auto object-contain"
                                  src={selectedMnemonicType}
                                  alt=""
                                />
                              </div>
                            </Item2>

                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              onClick={async () => {
                                setSelectedMnemonicType("");
                                setMnemonicType("");
                                setSelectedMnemonic(false);
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
                              <BackIcon />
                            </Button>
                          </Grid>
                        </Grid>
                      </TabPanel>
                      <TabPanel value="3">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          <Grid xs={4} sm={6} md={12}>
                            <Item2>{selectedMnemonicType}</Item2>

                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              disabled={!storyGenerated}
                              onClick={async () => {
                                setSelectedMnemonicType("");
                                setMnemonicType("");
                                setSelectedMnemonic(false);
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
                              <BackIcon />
                            </Button>
                          </Grid>
                        </Grid>
                      </TabPanel>
                    </TabContext>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateListOfWords;

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
