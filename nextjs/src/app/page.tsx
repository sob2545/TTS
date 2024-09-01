import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CourseList from "./components/CourseList";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth");
  }

  const courses = await prisma.course.findMany();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">App Title</h1>
      <CourseList courses={courses} />
    </div>
  );
}
