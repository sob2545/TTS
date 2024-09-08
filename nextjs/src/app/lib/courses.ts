import prisma from "./prisma";

export async function getCourse(courseId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { chapterNumber: "asc" },
        },
      },
    });

    return course;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}
