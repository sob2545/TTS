import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, courseId, chapterNumber } = body;

  try {
    const userCourseProgress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!userCourseProgress) {
      throw new Error("UserCourseProgress not found");
    }

    const updatedChapterProgress = await prisma.chapterProgress.upsert({
      where: {
        userCourseProgressId_chapterNumber: {
          userCourseProgressId: userCourseProgress.id,
          chapterNumber,
        },
      },
      update: {
        repeatCount: {
          increment: 1,
        },
      },
      create: {
        userCourseProgressId: userCourseProgress.id,
        chapterNumber,
        repeatCount: 1,
      },
    });

    return NextResponse.json(updatedChapterProgress);
  } catch (error) {
    console.error("Failed to update repeat count:", error);
    return NextResponse.json(
      { error: "Failed to update repeat count" },
      { status: 500 }
    );
  }
}
