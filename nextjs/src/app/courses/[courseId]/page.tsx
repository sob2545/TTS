import { getCourse } from "@/lib/courses";
import ChapterContent from "@/components/ChapterContent";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return <div>Please log in to view this course.</div>;
  }

  const course = await getCourse(params.courseId);

  if (!course) {
    return <div>Course not found.</div>;
  }

  // Add a timestamp to force re-fetch
  const timestamp = new Date().getTime();
  const userCourseProgress = await prisma.userCourseProgress.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: course.id,
      },
    },
    include: {
      chapterProgresses: true,
    },
  });

  const initialChapter =
    course.chapters.find(
      (chapter) =>
        chapter.chapterNumber === (userCourseProgress?.lastChapterNumber || 1)
    ) || course.chapters[0];

  return (
    <ChapterContent
      key={timestamp}
      course={course}
      initialChapter={initialChapter}
      userId={userId}
      userCourseProgress={
        userCourseProgress || {
          id: "",
          userId,
          courseId: course.id,
          lastChapterNumber: 1,
          chapterProgresses: [],
        }
      }
    />
  );
}
