import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Chapter, Course } from "@prisma/client";

export function useChapterNavigation(
  initialChapter: Chapter & { course: Course }
) {
  const [currentChapter, setCurrentChapter] = useState(initialChapter);
  const [loading, setLoading] = useState(false);
  const [totalChapters, setTotalChapters] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const router = useRouter();

  const fetchChapters = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/chapters?courseId=${initialChapter.courseId}`
      );
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters);
        setTotalChapters(data.chapters.length);
      }
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
    setLoading(false);
  }, [initialChapter.courseId]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  const navigateToChapter = useCallback(
    (direction: "prev" | "next") => {
      const currentIndex = chapters.findIndex(
        (ch) => ch.id === currentChapter.id
      );
      const newIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;

      if (newIndex < 0 || newIndex >= chapters.length) return;

      const newChapter = chapters[newIndex];
      router.push(
        `/courses/${currentChapter.courseId}/chapters/${newChapter.id}`
      );
    },
    [currentChapter, chapters, router]
  );

  useEffect(() => {
    const chapter = chapters.find((ch) => ch.id === initialChapter.id);
    if (chapter) {
      setCurrentChapter(chapter);
    }
  }, [initialChapter.id, chapters]);

  return { currentChapter, navigateToChapter, loading, totalChapters };
}
