import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId, courseId, chapterNumber, completed } = await req.json();

  if (
    !userId ||
    !courseId ||
    chapterNumber === undefined ||
    completed === undefined
  ) {
    return NextResponse.json(
      { error: "Missing userId, courseId, chapterNumber, or completed" },
      { status: 400 }
    );
  }

  try {
    const updatedChapterProgress = await prisma.chapterProgress.updateMany({
      where: {
        userCourseProgress: {
          userId,
          courseId,
        },
        chapterNumber,
      },
      data: {
        completed,
      },
    });

    return NextResponse.json(updatedChapterProgress);
  } catch (error) {
    console.error("Error updating chapter progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
