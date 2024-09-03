"use client";

import { Course, Chapter } from "@prisma/client";
import styles from "@/styles/CourseList.module.css";
import { getYoutubeThumbnail } from "@/data/youtube";
import { useRouter } from "next/navigation";

type CourseWithFirstChapter = Course & {
  chapters: Chapter[];
};

type CourseListProps = {
  courses: CourseWithFirstChapter[];
};

export default function CourseList({ courses }: CourseListProps) {
  const router = useRouter();

  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  return (
    <div className={styles.grid}>
      {courses.map((course) => (
        <div
          key={course.id}
          className={styles.card}
          onClick={() => handleCourseClick(course.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCourseClick(course.id);
            }
          }}
        >
          <img
            src={getYoutubeThumbnail(
              course.isSingleVideo
                ? course.videoId!
                : course.chapters[0].videoId
            )}
            alt={course.title}
            className={styles.cardImage}
          />
          <h2 className={styles.cardTitle}>{course.title}</h2>
          <p className={styles.cardDescription}>{course.description}</p>
        </div>
      ))}
    </div>
  );
}
