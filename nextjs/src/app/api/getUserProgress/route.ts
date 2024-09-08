import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const courseId = searchParams.get("courseId");

  if (!userId || !courseId) {
    return NextResponse.json(
      { error: "Missing userId or courseId" },
      { status: 400 }
    );
  }

  try {
    const userCourseProgress = await prisma.userCourseProgress.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        chapterProgresses: true,
      },
    });

    return NextResponse.json(userCourseProgress);
  } catch (error) {
    console.error("Failed to fetch user progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch user progress" },
      { status: 500 }
    );
  }
}
