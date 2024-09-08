"use client";

import Link from "next/link";
import {
  Course,
  Chapter,
  UserCourseProgress,
  ChapterProgress,
} from "@prisma/client";
import styles from "@/styles/CourseList.module.css";
import { getYoutubeThumbnail } from "@/data/youtube";

type CourseWithDetails = Course & {
  chapters: Chapter[];
  userCourseProgresses: (UserCourseProgress & {
    chapterProgresses: ChapterProgress[];
  })[];
};

type CourseListProps = {
  courses: CourseWithDetails[];
};

const getThumbnailUrl = (course: CourseWithDetails): string => {
  if (course.videoId) {
    return getYoutubeThumbnail(course.videoId);
  }
  if (course.playlistId) {
    return getYoutubeThumbnail(course.videoId!);
  }
  const firstChapter = course.chapters[0];
  return firstChapter ? getYoutubeThumbnail(firstChapter.videoId!) : "";
};

export default function CourseList({ courses }: CourseListProps) {
  return (
    <div className={styles.grid}>
      {courses.map((course) => (
        <Link href={`/courses/${course.id}`} key={course.id}>
          <div className={styles.card}>
            <img
              src={getThumbnailUrl(course)}
              alt={course.title}
              className={styles.cardImage}
            />
            <h2 className={styles.cardTitle}>{course.title}</h2>
            <p className={styles.cardDescription}>{course.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
