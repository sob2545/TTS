import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, courseId, lastChapterNumber } = body;

  try {
    const updatedUserCourseProgress = await prisma.userCourseProgress.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {
        lastChapterNumber,
      },
      create: {
        userId,
        courseId,
        lastChapterNumber,
      },
    });

    return NextResponse.json(updatedUserCourseProgress);
  } catch (error) {
    console.error("Failed to update last chapter:", error);
    return NextResponse.json(
      { error: "Failed to update last chapter" },
      { status: 500 }
    );
  }
}
