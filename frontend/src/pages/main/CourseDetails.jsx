/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";

import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import Footer from "@/widgets/Footer/Footer";
import CourseDetailsCard from "@/features/courseDetails/ui/CourseDetailsCard";
import { formatDate } from "@/shared/utils/formatDate";
import { fetchCourseDetails } from "@/entities/course/model/courseDetailsAPI";
import { buyCourse } from "@/entities/student/model/studentFeaturesAPI";
import GetAvgRating from "@/utils/avgRating";
import { ACCOUNT_TYPE } from "@/utils/constants";
import { addToCart } from "@/entities/cart/model/cartSlice";

import CourseDetailsHeader from "../../features/courseDetails/ui/CourseDetailsHeader";
import CourseContentPanel from "../../features/courseDetails/ui/CourseContentPanel";
import CourseAuthorCard from "../../features/courseDetails/ui/CourseAuthorCard";
import { BiArrowBack } from "react-icons/bi";

function CourseDetails() {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.profile);
  const { paymentLoading } = useSelector((state) => state.course);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [response, setResponse] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  useEffect(() => {
    const fectchCourseDetailsData = async () => {
      try {
        const res = await fetchCourseDetails(courseId);
        setResponse(res);
      } catch (error) {
        console.log("Could not fetch Course Details");
      }
    };
    fectchCourseDetailsData();
  }, [courseId]);

  const [avgReviewCount, setAvgReviewCount] = useState(0);
  useEffect(() => {
    const count = GetAvgRating(response?.data?.courseDetails.ratingAndReviews);
    setAvgReviewCount(count);
  }, [response]);

  const [isActive, setIsActive] = useState([]);
  const handleActive = (id) => {
    setIsActive(!isActive.includes(id) ? isActive.concat([id]) : isActive.filter((e) => e !== id));
  };

  const [totalNoOfLectures, setTotalNoOfLectures] = useState(0);
  useEffect(() => {
    let lectures = 0;
    response?.data?.courseDetails?.courseContent?.forEach((sec) => {
      lectures += sec.subSection?.length || 0;
    });
    setTotalNoOfLectures(lectures);
  }, [response]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (paymentLoading || loading || !response) {
    return (
      <div className="relative w-full bg-white  mt-15">
        <div className="mx-auto px-4 lg:px-8 max-w-[1260px] pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded border-[#efe7ff] -2xl border border-[#efe7ff] shadow-md p-6">
                <div className="h-44 sm:h-56 rounded border-[#efe7ff] -lg skeleton bg-gray-100" />
                <div className="mt-4 space-y-2">
                  <div className="h-8 w-3/4 rounded border-[#efe7ff]  skeleton" />
                  <div className="h-4 w-1/2 rounded border-[#efe7ff]  skeleton" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    <div className="h-8 w-20 rounded border-[#efe7ff] -full skeleton" />
                    <div className="h-8 w-16 rounded border-[#efe7ff] -full skeleton" />
                    <div className="h-8 w-24 rounded border-[#efe7ff] -full skeleton" />
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[830px] mx-auto bg-white rounded border-[#efe7ff] -2xl border border-[#efe7ff] p-6 shadow-md">
                <div className="mb-4">
                  <div className="h-7 w-40 rounded border-[#efe7ff]  skeleton mb-3" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-20 rounded border-[#efe7ff] -full skeleton" />
                    <div className="h-8 w-16 rounded border-[#efe7ff] -full skeleton" />
                    <div className="h-8 w-24 rounded border-[#efe7ff] -full skeleton" />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                  <div className="h-8 w-52 rounded border-[#efe7ff]  skeleton" />
                  <div className="flex items-center gap-4">
                    <div className="h-5 w-20 rounded border-[#efe7ff]  skeleton" />
                    <div className="h-5 w-20 rounded border-[#efe7ff]  skeleton" />
                    <div className="h-8 w-28 rounded border-[#efe7ff] -full skeleton" />
                  </div>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border rounded border-[#efe7ff] -2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded border-[#efe7ff] -full skeleton" />
                          <div className="h-5 w-64 rounded border-[#efe7ff]  skeleton" />
                        </div>
                        <div className="h-5 w-14 rounded border-[#efe7ff]  skeleton" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-3/4 rounded border-[#efe7ff]  skeleton" />
                        <div className="h-4 w-1/2 rounded border-[#efe7ff]  skeleton" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-6">
                <div className="bg-white rounded border-[#efe7ff] -2xl border border-[#efe7ff] shadow-md p-4">
                  <div className="h-44 md:h-56 w-full rounded border-[#efe7ff] -lg skeleton" />
                  <div className="mt-4 space-y-3">
                    <div className="h-8 w-1/2 rounded border-[#efe7ff]  skeleton" />
                    <div className="h-10 w-full rounded border-[#efe7ff]  skeleton" />
                    <div className="h-10 w-full rounded border-[#efe7ff]  skeleton" />
                    <div className="h-4 w-3/4 rounded border-[#efe7ff]  skeleton mt-2" />
                  </div>
                </div>

                <div className="bg-white rounded border-[#efe7ff] -2xl border border-[#efe7ff] shadow-md p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded border-[#efe7ff] -full skeleton" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-3/4 rounded border-[#efe7ff]  skeleton" />
                      <div className="h-4 w-1/2 rounded border-[#efe7ff]  skeleton" />
                      <div className="h-4 w-full rounded border-[#efe7ff]  skeleton" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }


  const {
    courseName,
    courseDescription,
    thumbnail,
    price,
    whatYouWillLearn,
    courseContent,
    ratingAndReviews,
    instructor,
    studentsEnrolled,
    createdAt,
    tag,
  } = response?.data?.courseDetails || {};

  const handleBuyCourse = () => {
    if (token) {
      const coursesId = [courseId];
      buyCourse(token, coursesId, user, navigate, dispatch);
      return;
    }
    setConfirmationModal({
      text1: "You are not logged in!",
      text2: "Please login to Purchase Course.",
      btn1Text: "Login",
      btn2Text: "Cancel",
      btn1Handler: () => navigate("/login"),
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  const handleAddToCart = () => {
    if (user && user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      toast.error("You are an Instructor. You can't buy a course.");
      return;
    }
    if (token) {
      dispatch(addToCart(response?.data.courseDetails));
      toast.success("Added to cart");
      return;
    }
    setConfirmationModal({
      text1: "You are not logged in!",
      text2: "Please login to add To Cart",
      btn1Text: "Login",
      btn2Text: "Cancel",
      btn1Handler: () => navigate("/login"),
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  return (
    <>
      <div className="relative w-full bg-[#ffffff] mt-15">
        <div className="mx-auto px-4 lg:px-8 max-w-[1260px] pt-8">
          <div className={`w-full flex self-start mt-10 -ml-3`}>
            <Link
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-sm font-medium text-violet-500 hover:text-violet-700 transition-colors mt-4 ml-4 sm:mt-0"
            >
              <BiArrowBack className="mr-2" />
              Back
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[420px] py-8 mr-5">
            <div className="lg:col-span-8">
              <CourseDetailsHeader
                courseName={courseName}
                courseDescription={courseDescription}
                createdAt={createdAt}
                whatYouWillLearn={whatYouWillLearn}
              />
              <CourseContentPanel
                sections={courseContent}
                totalLectures={totalNoOfLectures}
                className="mx-auto w-full"
              />
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-24">
                <CourseDetailsCard
                  course={response?.data?.courseDetails}
                  setConfirmationModal={setConfirmationModal}
                  handleBuyCourse={handleBuyCourse}
                />

                <CourseAuthorCard instructor={instructor} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}

export default CourseDetails;
