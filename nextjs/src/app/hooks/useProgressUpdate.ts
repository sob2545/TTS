import { useState, useCallback, useEffect } from "react";

export function useProgressUpdate(
  userId: string,
  courseId: string,
  chapterId: string
) {
  const [repeatCount, setRepeatCount] = useState<number>(0);

  const fetchProgress = useCallback(async () => {
    if (!userId || !courseId || !chapterId) return;
    try {
      const response = await fetch(
        `/api/progress?userId=${userId}&courseId=${courseId}&chapterId=${chapterId}`
      );
      if (response.ok) {
        const data = await response.json();
        setRepeatCount(data.repeatCount);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  }, [userId, courseId, chapterId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress, chapterId]);

  const incrementRepeatCount = useCallback(async () => {
    const newCount = repeatCount + 1;
    setRepeatCount(newCount);
    try {
      const response = await fetch("/api/updateProgress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId,
          chapterId,
          repeatCount: newCount,
        }),
      });
      if (!response.ok) {
        console.error("Failed to update repeat count");
        setRepeatCount(repeatCount); // 업데이트 실패 시 이전 값으로 되돌림
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      setRepeatCount(repeatCount); // 에러 발생 시 이전 값으로 되돌림
    }
  }, [userId, courseId, chapterId, repeatCount]);

  const updateLastVisitedChapter = useCallback(async () => {
    try {
      await fetch("/api/updateLastVisitedChapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId,
          chapterId,
        }),
      });
    } catch (error) {
      console.error("Error updating last visited chapter:", error);
    }
  }, [userId, courseId, chapterId]);

  return {
    repeatCount,
    incrementRepeatCount,
    updateLastVisitedChapter,
    fetchProgress,
  };
}
