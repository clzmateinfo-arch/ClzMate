const SubSection = require("../models/subSection")
const CourseProgress = require("../models/courseProgress")

exports.updateCourseProgress = async (req, res) => {
  const { courseId, subSectionId } = req.body
  const userId = req.user.id

  try {
    const subsection = await SubSection.findById(subSectionId)
    if (!subsection) {
      return res.status(404).json({ error: "Invalid subsection" })
    }

    let courseProgress = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    })

    if (!courseProgress) {
      return res.status(404).json({
        success: false,
        message: "Course progress Does Not Exist",
      })
    } else {
      if (courseProgress.completedVideos.includes(subSectionId)) {
        return res.status(400).json({ error: "Subsection already completed" })
      }

      courseProgress.completedVideos.push(subSectionId)
    }

    await courseProgress.save()

    return res.status(200).json({ message: "Course progress updated" })
  }
  catch (error) {
    console.error(error)
    return res.status(500).json({ error: "Internal server error" })
  }
}
