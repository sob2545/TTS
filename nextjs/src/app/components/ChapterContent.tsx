"use client";

import { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { Chapter, Course } from "@prisma/client";
import styles from "@/styles/ChapterContent.module.css";

interface ChapterContentProps {
  chapter: Chapter & { course: Course };
}

const ChapterContent: React.FC<ChapterContentProps> = ({ chapter }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("Ready");
  const [repeatCount, setRepeatCount] = useState(0);
  const recognitionRef = useRef<any>(null);

  const videoId = chapter.course.isSingleVideo
    ? chapter.course.videoId
    : chapter.videoId;

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        setTranscript(transcript);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        } else {
          evaluateSpeech();
        }
      };
    }
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("Ready");
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const evaluateSpeech = () => {
    const normalizedOriginal = normalizeString(chapter.sentence);
    const normalizedTranscript = normalizeString(transcript);

    if (normalizedOriginal === normalizedTranscript) {
      setRepeatCount((prev) => prev + 1);
    }
  };

  const normalizeString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  };

  return (
    <div>
      <header className={styles.header}>
        <button
          onClick={() => window.history.back()}
          className={styles.backButton}
        >
          &#8592;
        </button>
      </header>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.youtubeContainer}>
            <YouTube
              videoId={videoId}
              opts={{
                width: "100%",
                playerVars: {
                  start: chapter.startTime,
                },
              }}
            />
          </div>
          <h2 className={styles.chapterTitle}>
            Chapter {chapter.chapterNumber}
          </h2>
          <div className={styles.sentenceBox}>
            <p className={styles.sentence}>{chapter.sentence}</p>
            <div className={styles.divider}></div>
            <p className={styles.transcript}>{transcript}</p>
          </div>
          <p className={styles.repeatCount}>Repeated: {repeatCount} times</p>
          <button
            onClick={toggleListening}
            className={`${styles.recordButton} ${
              isListening ? styles.recordingButton : ""
            }`}
          >
            {isListening ? "Stop Recording" : "Start Recording"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterContent;
