"use client";

import { Course } from "@prisma/client";

type CourseListProps = {
  courses: Course[];
};

export default function CourseList({ courses }: CourseListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <div key={course.id} className="border p-4 rounded">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-40 object-cover mb-2"
          />
          <h2 className="text-lg font-semibold">{course.title}</h2>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
}
