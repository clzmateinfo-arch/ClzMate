/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import Footer from "@/widgets/Footer/Footer";
import CourseDetailsCard from "@/features/courseDetails/ui/CourseDetailsCard";
import { formatDate } from "@/shared/utils/formatDate";
import { fetchCourseDetails } from "@/entities/course/model/courseDetailsAPI";
import { buyCourse } from "@/entities/student/model/studentFeaturesAPI";
import GetAvgRating from "@/utils/avgRating";
import { ACCOUNT_TYPE } from "@/utils/constants";
import { setCart } from "@/entities/cart/model/cartSlice";

import CourseDetailsHeader from "../../features/courseDetails/ui/CourseDetailsHeader";
import CourseContentPanel from "../../features/courseDetails/ui/CourseContentPanel";
import CourseAuthorCard from "../../features/courseDetails/ui/CourseAuthorCard";
import { BiArrowBack } from "react-icons/bi";
import NewCourses from "../../features/portfolio/ui/NewCourses";
import bgImage from "@/shared/assets/images/background.png";

function CourseDetails() {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.profile);
  const { paymentLoading } = useSelector((state) => state.course);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const location = useLocation();

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
  }, [location.pathname]);

  if (paymentLoading || loading || !response) {
    return (
      <div className="relative w-full bg-white mt-15">
        <div className="mx-auto px-4 lg:px-8 max-w-[1260px] pt-8">
          <div className="w-full flex self-start mt-6 -ml-3">
            <div className="inline-flex items-center text-sm font-medium text-violet-500 transition-colors mt-4 ml-4 sm:mt-0">
              <BiArrowBack className="mr-2 opacity-40" />
              <span className="opacity-40">Back</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm animate-pulse">
                <div className="h-48 w-full rounded-lg bg-white/8" />
                <div className="mt-6 space-y-3">
                  <div className="h-7 w-3/4 rounded bg-white/8" />
                  <div className="h-4 w-1/2 rounded bg-white/8" />
                  <div className="flex flex-wrap gap-3 mt-3">
                    <div className="h-8 w-20 rounded-full bg-white/8" />
                    <div className="h-8 w-16 rounded-full bg-white/8" />
                    <div className="h-8 w-24 rounded-full bg-white/8" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm animate-pulse">
                <div className="mb-4">
                  <div className="h-6 w-40 rounded bg-white/8 mb-3" />
                  <div className="flex flex-wrap gap-3">
                    <div className="h-8 w-20 rounded-full bg-white/8" />
                    <div className="h-8 w-16 rounded-full bg-white/8" />
                    <div className="h-8 w-24 rounded-full bg-white/8" />
                  </div>
                </div>

                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-white/8 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-white/8" />
                          <div className="h-5 w-64 rounded bg-white/8" />
                        </div>
                        <div className="h-5 w-14 rounded bg-white/8" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-white/8" />
                        <div className="h-4 w-1/2 rounded bg-white/8" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-6">
                <div className="rounded-2xl p-4 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm animate-pulse">
                  <div className="h-44 md:h-56 w-full rounded-lg bg-white/8" />
                  <div className="mt-4 space-y-3">
                    <div className="h-8 w-1/2 rounded bg-white/8" />
                    <div className="h-10 w-full rounded bg-white/8" />
                    <div className="h-10 w-full rounded bg-white/8" />
                    <div className="h-4 w-3/4 rounded bg-white/8 mt-2" />
                  </div>
                </div>

                <div className="rounded-2xl p-4 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-white/8" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-3/4 rounded bg-white/8" />
                      <div className="h-4 w-1/2 rounded bg-white/8" />
                      <div className="h-4 w-full rounded bg-white/8" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="gap-8 items-start min-h-[180px] py-8 mr-5">
            <div className="rounded-2xl p-6 bg-white/6 backdrop-blur-md border border-white/8 shadow-sm animate-pulse">
              <div className="h-6 w-48 rounded bg-white/8 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-40 rounded-2xl bg-white/8" />
                ))}
              </div>
            </div>
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
    requiresApproval,
  } = response?.data?.courseDetails || {};

  const handleBuyCourse = () => {
    if (token) {
      const coursesId = [courseId];
      buyCourse(token, coursesId, requiresApproval, user, navigate, dispatch);
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
      dispatch(setCart(response?.data.courseDetails));
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

  const onViewProfile = () => {
    navigate(`/profile/public/${instructor._id}`);
  };

  return (
    <div>
      <div className="relative w-full mt-15">
        <div className="mx-auto px-4 lg:px-8 max-w-[1260px] pt-8">
          <div className="w-full flex self-start mt-10 -ml-3">
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
              {response?.data?.courseDetails?.requiresApproval && (
                <div className="mb-4 p-3 rounded-xl bg-yellow-50 border border-yellow-300">
                  <p className="text-sm font-medium text-yellow-700">
                    This course requires instructor approval to follow
                  </p>
                </div>
              )}
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
                tags={tag}
              />
            </div>

            <aside className="lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-24">
                <CourseDetailsCard
                  course={response?.data?.courseDetails}
                  setConfirmationModal={setConfirmationModal}
                  handleBuyCourse={handleBuyCourse}
                />

                <CourseAuthorCard instructor={instructor} onViewProfile={onViewProfile} />
              </div>
            </aside>
          </div>

          <div className="gap-8 items-start min-h-[420px] py-8 mr-5">
            <NewCourses />
          </div>
        </div>
      </div>

      <Footer />
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </div>
  );
}

export default CourseDetails;
