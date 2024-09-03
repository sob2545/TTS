import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CourseList from "./components/CourseList";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import styles from "@/styles/HomePage.module.css";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  const courses = await prisma.course.findMany({
    include: {
      chapters: {
        orderBy: {
          chapterNumber: "asc",
        },
        take: 1,
      },
    },
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome, {session.user?.name}</h1>
      <CourseList courses={courses} />
    </div>
  );
}
