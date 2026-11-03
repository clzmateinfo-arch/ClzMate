const mongoose = require("mongoose");
const Category = require("../src/models/category");
const Course = require("../src/models/course");
const Section = require("../src/models/section");
const SubSection = require("../src/models/subSection");
const CourseProgress = require("../src/models/courseProgress");
const User = require("../src/models/user");

const newId = () => new mongoose.Types.ObjectId();

async function createCategory(name = "Programming") {
  return Category.create({ name, description: `${name} courses` });
}

async function createCourse({ instructor, category, price = 0, status = "Published", requiresApproval = false, students = [], courseName = "Course" } = {}) {
  const resolvedCategory = category || (await createCategory(`Cat-${newId()}`));
  const course = await Course.create({
    courseName,
    courseDescription: "A description",
    whatYouWillLearn: "Things",
    instructor: instructor._id,
    price,
    thumbnail: `https://res.cloudinary.com/demo/image/authenticated/v1/data/thumb_${newId()}.png`,
    category: resolvedCategory._id,
    tag: ["tag"],
    instructions: ["instruction"],
    status,
    requiresApproval,
    studentsEnrolled: students.map((student) => student._id),
  });
  await Category.updateOne({ _id: resolvedCategory._id }, { $push: { courses: course._id } });
  await User.updateOne({ _id: instructor._id }, { $push: { courses: course._id } });
  for (const student of students) await enrollRecord(course, student);
  return course;
}

async function enrollRecord(course, student) {
  const progress = await CourseProgress.create({ courseID: course._id, userId: student._id, completedVideos: [] });
  await User.updateOne({ _id: student._id }, { $addToSet: { courses: course._id, courseProgress: progress._id } });
  return progress;
}

async function addSection(course, sectionName = "Section") {
  const section = await Section.create({ sectionName });
  await Course.updateOne({ _id: course._id }, { $push: { courseContent: section._id } });
  return section;
}

async function addSubSection(section, publicId = `data/asset_${newId()}`) {
  const subSection = await SubSection.create({
    title: "Lecture",
    description: "Lecture description",
    supportMaterials: [
      {
        url: `https://res.cloudinary.com/demo/raw/authenticated/v1/${publicId}.pdf`,
        publicId,
        resourceType: "raw",
        mimeType: "application/pdf",
        isMainPdf: true,
      },
    ],
  });
  await Section.updateOne({ _id: section._id }, { $push: { subSection: subSection._id } });
  return subSection;
}

module.exports = { newId, createCategory, createCourse, enrollRecord, addSection, addSubSection };
