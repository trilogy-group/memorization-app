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

// import { Navigation } from "../components/navigation/navigation";
import Navigation from "../components/navigation/navigation";

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
  const uploadMutation = trpc.useMutation("question.create");

  const [mnemonicImage, setMnemonicImage] = useState<string[]>([]);
  const [acronym, setAcronym] = useState<string[]>([]);

  const [story, setStory] = useState<string[]>([]);

  const imgRecommendationMutation = trpc.useMutation("recommendImg.stabledif");
  const acroRecommendationMutation = trpc.useMutation("recommendAcro.acronym");
  const storyRecommendationMutation = trpc.useMutation("recommendStory.story");

  const [inputValue, setInputValue] = useState("");
  const [inputPromptValue, setInputPromptValue] = useState("");
  const [inputQuestionValue, setInputQuestionValue] = useState("");

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

  const [value, setValue] = useState("1");
  const [storyGenerated, setStoryGenerated] = useState(false);
  const [acronymGenerated, setAcronymGenerated] = useState(false);
  const [selectedMnemonic, setSelectedMnemonic] = useState(false);
  const [selectedMnemonicType, setSelectedMnemonicType] = useState("");

  const [open, setOpen] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
    if (newValue === "3" && !storyGenerated && wordList.length > 0) {
      handleRecommeddedStoryList();
      setStoryGenerated(true);
    } else if (newValue === "1" && !acronymGenerated && wordList.length > 0) {
      handleRecommeddedAcronymList();
      setAcronymGenerated(true);
    }
  };

  useEffect(() => {
    if (uploadMutation.error) {
      toast.error("Failed to load the video", {
        position: "bottom-right",
      });
    }
  }, [uploadMutation.error]);

  const handleRecommeddedImage = async (index: Number) => {
    let prevLoading = isLoadingImage;
    prevLoading[Number(index)] = true;
    setIsLoadingImage(prevLoading);

    const created = await imgRecommendationMutation.mutateAsync({
      description: inputPromptValue,
    });
    let prevMnemonicImage = mnemonicImage;
    prevMnemonicImage[Number(index)] = created?.filename;
    setMnemonicImage(prevMnemonicImage);
    setIsLoadingMnemonic(false);

    prevLoading = isLoadingImage;
    prevLoading[Number(index)] = false;
    setIsLoadingImage(prevLoading);
  };

  const handleRecommeddedImageList = async () => {
    let prevLoading = isLoadingImage;
    for (let i = 0; i < 4; i++) {
      prevLoading[i] = true;
      setIsLoadingImage(prevLoading);
    }

    setIsLoadingMnemonic(true);
    for (let i = 0; i < 4; i++) {
      prevLoading = isLoadingImage;
      prevLoading[Number(i)] = true;
      setIsLoadingImage(prevLoading);

      const imageCreated = await imgRecommendationMutation.mutateAsync({
        description: inputPromptValue,
      });
      setMnemonicImage((mnemonicImage) => [
        ...mnemonicImage,
        imageCreated?.filename,
      ]);

      prevLoading = isLoadingImage;
      prevLoading[Number(i)] = false;
      setIsLoadingImage(prevLoading);
    }
    setIsLoadingMnemonic(false);
  };

  const handleRecommeddedAcronym = async (index: Number) => {
    let prevLoading = isLoadingAcronym;
    prevLoading[Number(index)] = true;
    setIsLoadingAcronym(prevLoading);

    setIsLoadingMnemonic(true);
    var acronymLeters = "";

    //Get first leter for each word in wordList

    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        const arrayOfLeters = wordList[i]?.split("");
        if (arrayOfLeters != undefined) {
          acronymLeters += arrayOfLeters[0];
        }
      }
      acronymLeters = acronymLeters.toUpperCase();
    }
    const acronymCreated = await acroRecommendationMutation.mutateAsync({
      description: acronymLeters,
    });
    let prevAcronym = acronym;
    prevAcronym[Number(index)] =
      "Remember " + acronymLeters + " with: " + String(acronymCreated?.result);
    setIsLoadingMnemonic(false);

    prevLoading = isLoadingAcronym;
    prevLoading[Number(index)] = false;
    setIsLoadingAcronym(prevLoading);
  };

  const handleRecommeddedAcronymList = async () => {
    let prevLoading = isLoadingAcronym;
    for (let i = 0; i < 4; i++) {
      prevLoading[i] = true;
      setIsLoadingAcronym(prevLoading);
    }

    setIsLoadingMnemonic(true);
    var acronymLeters = "";

    //Get first leter for each word in wordList

    for (let i = 0; i < wordList.length; i++) {
      if (wordList[i] != undefined) {
        const arrayOfLeters = wordList[i]?.split("");
        if (arrayOfLeters != undefined) {
          acronymLeters += arrayOfLeters[0];
        }
      }
      acronymLeters = acronymLeters.toUpperCase();
    }
    setAcronym(() => []);
    for (let i = 0; i < 4; i++) {
      const acronymCreated = await acroRecommendationMutation.mutateAsync({
        description: acronymLeters,
      });
      setAcronym((prevAcronym) => [
        ...prevAcronym,
        "Remember " +
          acronymLeters +
          " with: " +
          String(acronymCreated?.result),
      ]);
      prevLoading = isLoadingAcronym;
      prevLoading[Number(i)] = false;
      setIsLoadingAcronym(prevLoading);
    }
    setIsLoadingMnemonic(false);
  };

  const handleRecommeddedStory = async (index: Number) => {
    let prevLoading = isLoadingStory;
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
    prevStory[Number(index)] =
      "Remember " + storyWordList + " with: " + storyCreated?.result;
    setIsLoadingMnemonic(false);
    prevLoading = isLoadingStory;
    prevLoading[Number(index)] = false;
    setIsLoadingStory(prevLoading);
  };

  const handleRecommeddedStoryList = async () => {
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
        description: storyWordList,
      });
      setStory((prevStory) => [
        ...prevStory,
        "Remember " + storyWordList + " with: " + String(storyCreated?.result),
      ]);

      prevLoading = isLoadingStory;
      prevLoading[Number(i)] = false;
      setIsLoadingStory(prevLoading);
    }
    setIsLoadingMnemonic(false);
  };

  const handleUpload = async () => {
    // TODO: connect to the mnemonics generation backend
  };

  const handleAddToSequence = async () => {
    var entry = document.createElement("li");
    entry.innerHTML = tableEntryValue.trim();
    entry.className =
      "border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition";
    const answer = document.getElementById("answer");
    if (answer != null) {
      answer.appendChild(entry);
      wordList.push(tableEntryValue);
      if (value === "1") {
        handleRecommeddedAcronymList();
        setAcronymGenerated(true);
        setStoryGenerated(false);
      } else if (value === "3") {
        handleRecommeddedStoryList();
        setStoryGenerated(true);
        setAcronymGenerated(false);
      }
      setTableEntryValue("");
    } else {
      throw new Error("Missing element 'answer' table");
    }
  };

  // TODO: connect list of words answer with the curricular graph
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
              <div className="grid grid-cols-2 gap-11 p-2 w-[100%] h-[75%] mt-5 mb-2">
                <div className="col-span-1 h-full w-full">
                  <h1 className="text-2xl font-bold">
                    Memorize a list of words{" "}
                    <Navigation
                      open={open}
                      onClose={() => setOpen(false)}
                      addNodeToWorkspace={function (nodeId: string): void {
                        throw new Error("Function not implemented.");
                      }}
                    />
                  </h1>

                  <div className="grid gap-1" style={{ marginBottom: 10 }}>
                    {/* Button that sets open to true */}
                    <button
                      className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                      style={{ borderRadius: 5, padding: 5, width: 200 }}
                      onClick={() => setOpen(true)}
                    >
                      Select content
                    </button>
                    <Textarea
                      label="Enter your question"
                      placeholder="e.g., world leaders during WW2"
                      value={inputQuestionValue}
                      onChange={(e) => {
                        setInputQuestionValue(e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-span-1 h-[35%] w-full">
                    <p>Input below:</p>
                    <input
                      type="text"
                      id="newEntry"
                      className="p-2 w-full border border-gray-2 mt-1 mb-3 outline-none focus:border-gray-400 transition"
                      value={tableEntryValue}
                      onChange={(e) => {
                        setTableEntryValue(e.target.value);
                      }}
                    />
                    <div className="grid grid-cols-2">
                      <button
                        onClick={async () => {
                          await handleAddToSequence();
                        }}
                        disabled={!tableEntryValue.trim()}
                        className={`flex justify-center items-center gap-2 py-3 min-w-[20px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                        style={{ borderRadius: 5, padding: 5, width: 200 }}
                      >
                        <AiOutlinePlus className="w-5 h-5" />
                        Add entry
                      </button>
                    </div>
                    <ul id="answer"></ul>
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
                          <Tab label="Acronyms" value="1" />
                          <Tab label="Images" value="2" />
                          <Tab label="Storys" value="3" />
                        </TabList>
                      </Box>
                      <TabPanel value="1">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          {Array.from(Array(4)).map((_, index) => (
                            <Grid xs={4} sm={6} md={6} key={index}>
                              <Item>
                                <div className="flex justify-center items-center grid-cols-2">
                                  {!isLoadingAcronym[index] && acronym[index]}
                                </div>

                                <div className="flex justify-center items-center grid-cols-2">
                                  {isLoadingAcronym[index] && (
                                    <span className="w-10 h-10 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
                                  )}
                                </div>
                              </Item>
                              <Button
                                className="disabled:text-gray-400 disabled:bg-gray-200`"
                                disabled={
                                  !acronymGenerated || isLoadingAcronym[index]
                                }
                                variant="outlined"
                                color="success"
                                style={{
                                  bottom: 0,
                                  float: "left",
                                  margin: 5,
                                }}
                                onClick={async () => {
                                  setSelectedMnemonicType(acronym[index]);
                                  setSelectedMnemonic(true);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                className="disabled:text-gray-400 disabled:bg-gray-200`"
                                disabled={
                                  !acronymGenerated || isLoadingAcronym[index]
                                }
                                onClick={async () => {
                                  await handleRecommeddedAcronym(index);
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
                      <TabPanel value="2">
                        <div className="grid grid-cols-2">
                          <TextareaAutosize
                            aria-label="empty textarea"
                            placeholder="Prompt for image generation"
                            value={inputPromptValue}
                            onChange={(e) => {
                              setInputPromptValue(e.target.value);
                            }}
                            style={{ width: 200, marginBottom: 10, padding: 5 }}
                          />
                          <button
                            onClick={async () => {
                              setIsLoadingMnemonic(true);
                              await handleRecommeddedImageList();
                              setIsLoadingMnemonic(false);
                            }}
                            disabled={
                              !inputPromptValue.trim() || isLoadingMnemonic
                            }
                            className={`flex justify-center items-center gap-2 py-3 hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
                            style={{
                              borderRadius: 10,
                              padding: 5,
                              width: 100,
                              height: 38,
                              marginLeft: 10,
                            }}
                          >
                            Generate
                          </button>
                        </div>
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
                                variant="outlined"
                                color="success"
                                style={{
                                  bottom: 0,
                                  float: "left",
                                  margin: 5,
                                }}
                                onClick={async () => {
                                  setSelectedMnemonicType(mnemonicImage[index]);
                                  setSelectedMnemonic(true);
                                }}
                              >
                                Accept
                              </Button>
                              <Button
                                onClick={async () => {
                                  await handleRecommeddedImage(index);
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
                                  setSelectedMnemonicType(story[index]);
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
                          <Tab label="Acronyms" value="1" />
                          <Tab label="Images" value="2" />
                          <Tab label="Storys" value="3" />
                        </TabList>
                      </Box>
                      <TabPanel value="1">
                        <Grid
                          container
                          spacing={{ xs: 1, md: 1 }}
                          columns={{ xs: 4, sm: 8, md: 12 }}
                        >
                          <Grid xs={4} sm={6} md={12}>
                            <Item2>{selectedMnemonicType}</Item2>
                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              variant="outlined"
                              color="success"
                              style={{
                                bottom: 0,
                                float: "left",
                                margin: 5,
                              }}
                              onClick={async () => {
                                //handleConfirmMnemonic();
                                setSelectedMnemonic(true);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              onClick={async () => {
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
                              <RefreshIcon />
                            </Button>
                          </Grid>
                        </Grid>
                      </TabPanel>
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
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              variant="outlined"
                              color="success"
                              style={{
                                bottom: 0,
                                float: "left",
                                margin: 5,
                              }}
                              onClick={async () => {
                                //handleConfirmMnemonic();
                                setSelectedMnemonic(true);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              onClick={async () => {
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
                              <RefreshIcon />
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
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              variant="outlined"
                              color="success"
                              style={{
                                bottom: 0,
                                float: "left",
                                margin: 5,
                              }}
                              onClick={async () => {
                                //handleConfirmMnemonic();
                                setSelectedMnemonic(true);
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              className="disabled:text-gray-400 disabled:bg-gray-200`"
                              disabled={!acronymGenerated || isLoadingMnemonic}
                              onClick={async () => {
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
                              <RefreshIcon />
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
      <div className="flex flex-wrap gap-3">
        <p className="text-2xl font-bold">I want to upload my own</p>
        <Link href={"/upload"}>
          <a className="border rounded flex items-center gap-2 h-9 px-3 border-gray-200 bg-white hover:bg-gray-100 transition">
            <span>Videos</span>
          </a>
        </Link>
      </div>
      <div>
        <button
          onClick={async () => await handleUpload()}
          disabled={!inputValue.trim() || isLoading}
          className={`flex justify-center items-center gap-2 py-3 min-w-[170px] hover:brightness-90 transition text-white bg-red-1 disabled:text-gray-400 disabled:bg-gray-200`}
          style={{ borderRadius: 5, padding: 5 }}
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span>
          )}
          Post
        </button>
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
