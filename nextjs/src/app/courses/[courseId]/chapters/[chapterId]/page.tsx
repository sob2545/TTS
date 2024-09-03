import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import ChapterContent from "@/components/ChapterContent";

export default async function ChapterPage({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth");
  }

  const { courseId, chapterId } = params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true },
  });

  if (!chapter) {
    return <div>Chapter not found</div>;
  }

  return <ChapterContent chapter={chapter} course={chapter.course} />;
}
