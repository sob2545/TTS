const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  const rawData = fs.readFileSync(
    path.join(__dirname, "courses.json"),
    "utf-8"
  );
  const data = JSON.parse(rawData);

  for (const courseData of data.courses) {
    const { chapters, ...courseInfo } = courseData;

    const course = await prisma.course.create({
      data: courseInfo,
    });

    for (const chapterData of chapters) {
      await prisma.chapter.create({
        data: {
          ...chapterData,
          courseId: course.id,
        },
      });
    }
  }

  console.log("데이터 시딩이 완료되었습니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
