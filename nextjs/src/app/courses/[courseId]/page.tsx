import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/api/auth/[...nextauth]/route";

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  const courseId = params.courseId;
  const userId = session.user.id;

  const userProgress = await prisma.userProgress.findFirst({
    where: { userId, courseId },
    orderBy: { chapterId: "desc" },
  });

  const firstChapter = await prisma.chapter.findFirst({
    where: { courseId },
    orderBy: { chapterNumber: "asc" },
  });

  const redirectChapterId = userProgress?.chapterId || firstChapter?.id;

  if (redirectChapterId) {
    redirect(`/courses/${courseId}/chapters/${redirectChapterId}`);
  } else {
    // 챕터가 없는 경우의 처리
    return <div>No chapters found for this course.</div>;
  }
}
