"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import YouTube from "react-youtube";
import Toast from "./Toast";
import styles from "@/styles/ChapterContent.module.css";
import { useSwipeable } from "react-swipeable";
import { useMediaQuery } from "react-responsive";

export default function ChapterContent({
  course,
  initialChapter,
  userId,
  userCourseProgress: initialUserCourseProgress,
}: ChapterContentProps) {
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [userCourseProgress, setUserCourseProgress] = useState(
    initialUserCourseProgress
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("Ready");
  const [currentRepeatCount, setCurrentRepeatCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [nextAction, setNextAction] = useState<() => void>(() => {});
  const router = useRouter();

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef(transcript);
  const currentChapterRef = useRef(currentChapter);
  const userCourseProgressRef = useRef(userCourseProgress);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentChapter.chapterNumber < course.chapters.length) {
        handleNextChapter();
      }
    },
    onSwipedRight: () => {
      if (currentChapter.chapterNumber > 1) {
        handlePreviousChapter();
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  useEffect(() => {
    currentChapterRef.current = currentChapter;
  }, [currentChapter]);

  useEffect(() => {
    userCourseProgressRef.current = userCourseProgress;
  }, [userCourseProgress]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const stopListening = useCallback(() => {
    console.log("stopListening called");
    recognitionRef.current?.stop();
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    evaluateTranscript(transcriptRef.current);
  }, []);

  const pauseListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resumeListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  }, []);

  const startListening = useCallback(() => {
    setTranscript("Ready");
    initRecognition();
    recognitionRef.current?.start();
    setIsListening(true);
  }, []);

  useEffect(() => {
    return () => {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };
  }, [isListening]);

  useEffect(() => {
    const fetchLatestProgress = async () => {
      try {
        const response = await fetch(
          `/api/getUserProgress?userId=${userId}&courseId=${course.id}`
        );
        if (response.ok) {
          const latestProgress = await response.json();
          setUserCourseProgress(latestProgress);
          const latestChapter =
            course.chapters.find(
              (chapter) =>
                chapter.chapterNumber === latestProgress.lastChapterNumber
            ) || course.chapters[0];
          setCurrentChapter(latestChapter);
          updateCurrentRepeatCount(latestChapter.chapterNumber, latestProgress);
        }
      } catch (error) {
        console.error("Error fetching latest progress:", error);
      }
    };

    fetchLatestProgress();
  }, [userId, course.id, course.chapters]);

  const updateCurrentRepeatCount = useCallback(
    (chapterNumber: number, progress: any) => {
      const chapterProgress = progress.chapterProgresses.find(
        (cp: any) => cp.chapterNumber === chapterNumber
      );
      setCurrentRepeatCount(chapterProgress?.repeatCount || 0);
    },
    []
  );

  const updateLastChapter = useCallback(
    async (newChapterNumber: number) => {
      try {
        const response = await fetch("/api/updateLastChapter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            courseId: course.id,
            lastChapterNumber: newChapterNumber,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update last chapter");
        }

        const updatedUserCourseProgress = await response.json();
        setUserCourseProgress(updatedUserCourseProgress);
      } catch (error) {
        console.error("Error updating last chapter:", error);
      }
    },
    [userId, course.id]
  );

  const updateRepeatCount = useCallback(
    async (chapterNumber: number) => {
      console.log("updateRepeatCount 함수 호출됨");
      try {
        console.log("POST 요청 시작:", {
          userId,
          courseId: course.id,
          chapterNumber,
        });
        const response = await fetch("/api/updateRepeatCount", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            courseId: course.id,
            chapterNumber,
          }),
        });

        console.log("POST 요청 응답 상태:", response.status);

        if (!response.ok) {
          throw new Error("Failed to update repeat count");
        }

        const updatedChapterProgress = await response.json();
        console.log("업데이트된 챕터 진행 상황:", updatedChapterProgress);

        setCurrentRepeatCount(updatedChapterProgress.repeatCount);

        setUserCourseProgress((prev) => ({
          ...prev,
          chapterProgresses: prev.chapterProgresses.map((cp) =>
            cp.chapterNumber === chapterNumber ? updatedChapterProgress : cp
          ),
        }));
      } catch (error) {
        console.error("반복 횟수 업데이트 중 오류 발생:", error);
      }
    },
    [userId, course.id]
  );

  const handleChapterChange = useCallback(
    async (newChapterNumber: number) => {
      const newChapter = course.chapters.find(
        (ch) => ch.chapterNumber === newChapterNumber
      );
      if (newChapter) {
        setCurrentChapter(newChapter);
        setTranscript("Ready");
        await updateLastChapter(newChapterNumber);
        updateCurrentRepeatCount(
          newChapterNumber,
          userCourseProgressRef.current
        );

        const response = await fetch(
          `/api/getUserProgress?userId=${userId}&courseId=${course.id}`
        );
        if (response.ok) {
          const latestProgress = await response.json();
          setUserCourseProgress(latestProgress);
          updateCurrentRepeatCount(newChapterNumber, latestProgress);
        }
      }
    },
    [
      course.chapters,
      updateLastChapter,
      userId,
      course.id,
      updateCurrentRepeatCount,
    ]
  );

  const handlePageChange = useCallback(
    (action: () => void) => {
      if (isListening) {
        setShowToast(true);
        setNextAction(() => action);
        pauseListening();
      } else {
        action();
      }
    },
    [isListening, pauseListening]
  );

  const handlePreviousChapter = useCallback(() => {
    handlePageChange(() => {
      const prevChapterNumber = currentChapter.chapterNumber - 1;
      if (prevChapterNumber >= 1) {
        handleChapterChange(prevChapterNumber);
      }
    });
  }, [currentChapter.chapterNumber, handleChapterChange, handlePageChange]);

  const handleNextChapter = useCallback(() => {
    handlePageChange(() => {
      const nextChapterNumber = currentChapter.chapterNumber + 1;
      if (nextChapterNumber <= course.chapters.length) {
        handleChapterChange(nextChapterNumber);
      }
    });
  }, [
    currentChapter.chapterNumber,
    course.chapters.length,
    handleChapterChange,
    handlePageChange,
  ]);

  const handleConfirmPageChange = useCallback(() => {
    stopListening();
    setShowToast(false);
    nextAction();
  }, [stopListening, nextAction]);

  const handleCancelPageChange = useCallback(() => {
    setShowToast(false);
    resumeListening();
  }, [resumeListening]);

  const evaluateTranscript = useCallback(
    (finalTranscript: string) => {
      const currentChapterValue = currentChapterRef.current;
      console.log("Current chapter:", currentChapterValue.chapterNumber);
      const normalizedOriginal = currentChapterValue.sentence
        .toLowerCase()
        .trim();
      const normalizedTranscript = finalTranscript.toLowerCase().trim();

      console.log(`Original: <${normalizedOriginal}>`);
      console.log(`Transcript: <${normalizedTranscript}>`);

      if (normalizedOriginal === normalizedTranscript) {
        console.log("Sentences match!");
        updateRepeatCount(currentChapterValue.chapterNumber);
      } else {
        console.log("Sentences do not match.");
      }
    },
    [updateRepeatCount]
  );

  const initRecognition = useCallback(() => {
    if ("webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setTranscript(currentTranscript);
        resetSilenceTimeout();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }
  }, [isListening]);

  const resetSilenceTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      stopListening();
    }, 1500);
  }, [stopListening]);

  useEffect(() => {
    const currentProgress = userCourseProgress?.chapterProgresses?.find(
      (cp) => cp.chapterNumber === currentChapter.chapterNumber
    );
    setCurrentRepeatCount(currentProgress?.repeatCount || 0);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [currentChapter, userCourseProgress]);

  const getYouTubeOptions = useCallback(() => {
    const options: YouTubeProps["opts"] = {
      width: "100%",
      playerVars: {
        start: currentChapter.startTime,
      },
    };

    if (course.playlistId) {
      options.playerVars.listType = "playlist";
      options.playerVars.list = course.playlistId;
      options.playerVars.index = currentChapter.chapterNumber - 1; // YouTube 인덱스는 0부터 시작
    }

    return options;
  }, [course.playlistId, currentChapter]);

  return (
    <div className={styles.contentWrapper} {...handlers}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => handlePageChange(() => router.back())}
        >
          ←
        </button>
        <h1 className={styles.courseTitle}>{course.title}</h1>
      </div>
      <div className={styles.content}>
        <div className={styles.navigationButtonWrapper}>
          {!isMobile && (
            <button
              className={`${styles.navigationButtons} ${
                currentChapter.chapterNumber <= 1 ? styles.invisible : ""
              }`}
              onClick={handlePreviousChapter}
              disabled={currentChapter.chapterNumber <= 1}
            >
              &lt;
            </button>
          )}
        </div>
        <div className={styles.chapterContent}>
          <div className={styles.youtubeContainer}>
            <YouTube
              videoId={
                course.playlistId
                  ? undefined
                  : course.videoId || currentChapter.videoId
              }
              opts={getYouTubeOptions()}
            />
          </div>
          <h2 className={styles.chapterTitle}>
            Chapter {currentChapter.chapterNumber}
          </h2>
          <div className={styles.sentenceBox}>
            <p className={styles.sentence}>{currentChapter.sentence}</p>
            <div className={styles.divider}></div>
            <p className={styles.transcript}>{transcript}</p>
          </div>
          <p className={styles.repeatCount}>
            Repeat Count: {currentRepeatCount}
          </p>
          <div className={styles.recordButtonContainer}>
            <button
              className={`${styles.recordButton} ${
                isListening ? styles.recording : ""
              }`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? "Stop" : "Record"}
            </button>
          </div>
        </div>
        <div className={styles.navigationButtonWrapper}>
          {!isMobile && (
            <button
              className={`${styles.navigationButtons} ${
                currentChapter.chapterNumber >= course.chapters.length
                  ? styles.invisible
                  : ""
              }`}
              onClick={handleNextChapter}
              disabled={currentChapter.chapterNumber >= course.chapters.length}
            >
              &gt;
            </button>
          )}
        </div>
      </div>
      {showToast && (
        <Toast
          message="현재 페이지를 벗어나시겠습니까?"
          onConfirm={handleConfirmPageChange}
          onCancel={handleCancelPageChange}
        />
      )}
    </div>
  );
}
