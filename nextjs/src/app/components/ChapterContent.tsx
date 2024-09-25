"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import YouTube, { YouTubeProps } from "react-youtube";
import Toast from "./Toast";
import styles from "@/styles/ChapterContent.module.css";
import { useSwipeable } from "react-swipeable";
import { useMediaQuery } from "react-responsive";
import Firework from "./Firework";

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
  const [toastMessage, setToastMessage] = useState("");
  const [toastConfirmText, setToastConfirmText] = useState("예");
  const [toastCancelText, setToastCancelText] = useState("아니오");
  const [showFirework, setShowFirework] = useState(false);
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
    if (userCourseProgress && userCourseProgress.chapterProgresses) {
      userCourseProgressRef.current = userCourseProgress;
    } else {
      console.error(
        "chapterProgresses가 존재하지 않습니다.",
        userCourseProgress
      );
    }
  }, [userCourseProgress]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const stopListening = useCallback(() => {
    // console.log("stopListening called");
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
    async (chapterNumber: number, progress: any) => {
      if (progress && progress.chapterProgresses) {
        const chapterProgress = progress.chapterProgresses.find(
          (cp: any) => cp.chapterNumber === chapterNumber
        );
        setCurrentRepeatCount(chapterProgress?.repeatCount || 0);

        // 목표 달성 시 completed 값을 true로 변경
        const courseMaxRepeats = course.maxRepeats || [30];
        if (chapterProgress?.repeatCount >= (courseMaxRepeats[0] || 30)) {
          await fetch("/api/updateChapterProgress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId,
              courseId: course.id,
              chapterNumber,
              completed: true,
            }),
          });
        }
      } else {
        console.error("chapterProgresses가 존재하지 않습니다.", progress);
        setCurrentRepeatCount(0);
      }
    },
    [course.maxRepeats, userId, course.id]
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
      // console.log("updateRepeatCount 함수 호출됨");
      try {
        /*
        console.log("POST 요청 시작:", {
          userId,
          courseId: course.id,
          chapterNumber,
        });
        */
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
        // console.log("업데이트된 챕터 진행 상황:", updatedChapterProgress);

        setCurrentRepeatCount(updatedChapterProgress.repeatCount);

        setUserCourseProgress((prev: any) => ({
          ...prev,
          chapterProgresses: prev.chapterProgresses.map((cp: any) =>
            cp.chapterNumber === chapterNumber ? updatedChapterProgress : cp
          ),
        }));

        // 목표 달성 시 애니메이션 표시
        const courseMaxRepeats = course.maxRepeats || [30]; // 기본값 30
        if (updatedChapterProgress.repeatCount >= (courseMaxRepeats[0] || 30)) {
          setIsCongrats(true);
          setShowFirework(true); // 폭죽 애니메이션 표시
          setTimeout(() => {
            setShowFirework(false);
            setIsCongrats(false);
          }, 3000); // 3초 후 애니메이션 종료
        }
      } catch (error) {
        console.error("반복 횟수 업데이트 중 오류 발생:", error);
      }
    },
    [userId, course.id, course.maxRepeats]
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
        setToastMessage("현재 페이지를 벗어나시겠습니까?");
        setToastConfirmText("예");
        setToastCancelText("아니오");
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
      setShowToast(false);
      setIsListening(false);
      const prevChapterNumber = currentChapter.chapterNumber - 1;
      if (prevChapterNumber >= 1) {
        handleChapterChange(prevChapterNumber);
      }
    });
  }, [currentChapter.chapterNumber, handleChapterChange, handlePageChange]);

  const handleNextChapter = useCallback(() => {
    handlePageChange(() => {
      setShowToast(false);
      setIsListening(false);
      const nextChapterNumber = currentChapter.chapterNumber + 1;
      const courseMaxRepeats = course.maxRepeats || [30];

      if (nextChapterNumber <= course.chapters.length) {
        handleChapterChange(nextChapterNumber);
      }
    });
  }, [
    currentChapter.chapterNumber,
    course.chapters.length,
    handleChapterChange,
    handlePageChange,
    course.maxRepeats,
  ]);

  const handleCancelPageChange = useCallback(() => {
    setShowToast(false);
    resumeListening();
  }, [resumeListening]);

  const evaluateTranscript = useCallback(
    (finalTranscript: string) => {
      const currentChapterValue = currentChapterRef.current;
      console.log("Current chapter:", currentChapterValue.chapterNumber);

      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()
          .replace(/[.,!?;:]/g, "") // 구두점 제거
          .replace(/\s+/g, " ") // 연속된 공백을 하나로 줄임
          .trim()
          .replace(/\$(\d+)/g, (_, num) => {
            // 달러 표시 처리
            const n = parseInt(num);
            if (n === 1) return "one dollar";
            return `${num} dollars`;
          })
          .replace(/(\d+)(st|nd|rd|th)\b/g, (_, num, suffix) => {
            // 서수 처리
            return convertOrdinalToWords(parseInt(num));
          })
          .replace(/(\d+)m\b/g, "$1 meters") // 미터 처리
          .replace(/(\d+)cm\b/g, "$1 centimeters") // 센티미터 처리
          .replace(/(\d+)km\b/g, "$1 kilometers") // 킬로미터 처리
          .replace(/(\d+)([kKmMbBtT])\b/g, (_, num, unit) => {
            // 큰 숫자 처리
            const n = parseInt(num);
            switch (unit.toLowerCase()) {
              case "k":
                return `${n} thousand`;
              case "m":
                return `${n} million`;
              case "b":
                return `${n} billion`;
              case "t":
                return `${n} trillion`;
              default:
                return _;
            }
          })
          .replace(/(\d+)/g, (_, num) => {
            // 숫자를 단어로 변환
            return convertNumberToWords(parseInt(num));
          });
      };

      const convertNumberToWords = (num: number): string => {
        // 기존 함수 내용...
      };

      const convertOrdinalToWords = (num: number): string => {
        const ones = [
          "",
          "first",
          "second",
          "third",
          "fourth",
          "fifth",
          "sixth",
          "seventh",
          "eighth",
          "ninth",
        ];
        const tens = [
          "",
          "",
          "twentieth",
          "thirtieth",
          "fortieth",
          "fiftieth",
          "sixtieth",
          "seventieth",
          "eightieth",
          "ninetieth",
        ];
        const teens = [
          "tenth",
          "eleventh",
          "twelfth",
          "thirteenth",
          "fourteenth",
          "fifteenth",
          "sixteenth",
          "seventeenth",
          "eighteenth",
          "nineteenth",
        ];

        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
          const ten = Math.floor(num / 10);
          const one = num % 10;
          if (one === 0) return tens[ten];
          return convertNumberToWords(ten * 10) + " " + ones[one];
        }
        if (num < 1000) {
          const hundred = Math.floor(num / 100);
          const remainder = num % 100;
          if (remainder === 0)
            return convertNumberToWords(hundred) + " hundredth";
          return (
            convertNumberToWords(hundred) +
            " hundred " +
            convertOrdinalToWords(remainder)
          );
        }
        // 1000 이상의 숫자에 대한 처리는 필요에 따라 추가할 수 있습니다.
        return convertNumberToWords(num) + "th"; // 간단한 처리
      };

      const normalizedOriginal = normalizeText(currentChapterValue.sentence);
      const normalizedTranscript = normalizeText(finalTranscript);

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

  const handleVideoEnd = useCallback(() => {
    // endTime에 도달했을 때 아무 동작도 하지 않음
  }, []);

  const getYouTubeOptions = useCallback(() => {
    const options: YouTubeProps["opts"] = {
      width: "100%",
      playerVars: {
        start: currentChapter.startTime,
        ...(currentChapter.endTime !== null && { end: currentChapter.endTime }),
      },
    };

    if (course.playlistId) {
      options.playerVars.listType = "playlist";
      options.playerVars.list = course.playlistId;
      options.playerVars.index = currentChapter.chapterNumber - 1; // YouTube 인덱스는 0부터 시작
    }

    return options;
  }, [course.playlistId, currentChapter]);

  // 이전 챕터 완료 여부 확인
  const isPreviousChaptersCompleted = useCallback(() => {
    return course.chapters.every((chapter) => {
      if (chapter.chapterNumber < currentChapter.chapterNumber) {
        const progress = userCourseProgress.chapterProgresses.find(
          (cp: any) => cp.chapterNumber === chapter.chapterNumber
        );
        return progress?.completed;
      }
      return true;
    });
  }, [course.chapters, currentChapter.chapterNumber, userCourseProgress]);

  const handleRecordButtonClick = () => {
    if (!isPreviousChaptersCompleted()) {
      // 이전 챕터가 완료되지 않은 경우
      setToastMessage("이전 챕터를 완료해야 녹음할 수 있습니다.");
      setToastConfirmText("확인");
      setToastCancelText(""); // 취소 버튼을 숨기기 위해 빈 문자열 설정
      setShowToast(true);
      setNextAction(() => () => setShowToast(false));
      return; // 녹음 진행하지 않음
    }

    // 녹음 버튼 클릭 시 정상적으로 녹음 시작/중지
    isListening ? stopListening() : startListening();
  };

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
              onEnd={handleVideoEnd} // 수정된 핸들러 사용
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
            Repeat Count: {currentRepeatCount}/{course.maxRepeats[0] || 30}
          </p>
          <div className={styles.recordButtonContainer}>
            <button
              className={`${styles.recordButton} ${
                isListening ? styles.recording : ""
              }`}
              onClick={handleRecordButtonClick}
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
      {showFirework && <Firework />}
      {showToast && (
        <Toast
          message={toastMessage}
          onConfirm={nextAction}
          onCancel={toastCancelText ? handleCancelPageChange : undefined}
          confirmText={toastConfirmText}
          cancelText={toastCancelText}
        />
      )}
    </div>
  );
}
