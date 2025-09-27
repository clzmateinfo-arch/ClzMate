/* eslint-disable react/prop-types */
import copy from "copy-to-clipboard";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsFillCaretRightFill } from "react-icons/bs";
import { FaShareSquare, FaCheck } from "react-icons/fa";
import { setCart } from "@/entities/cart/model/cartSlice";
import { ACCOUNT_TYPE } from "@/utils/constants";
import Img from "@/shared/components/ui/Img";
import Button from "@/shared/components/ui/Button";
import { formatTimeAgo } from "@/shared/utils/formatDate";

export default function CourseDetailsCard({ course, setConfirmationModal, handleBuyCourse = () => { } }) {
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    thumbnail: ThumbnailImage,
    price: CurrentPrice,
    courseName,
    instructor,
    duration,
    category,
    studentsEnrolled = [],
    __v = 0,
    _id,
    id,
    instructions = [],
    createdAt = null,
    updatedAt = null
  } = course || {};

  const instructorName =
    typeof instructor === "string"
      ? instructor
      : instructor && (instructor.firstName || instructor.lastName)
        ? `${instructor.firstName ?? ""} ${instructor.lastName ?? ""}`.trim()
        : "";

  const studentsCount = Array.isArray(studentsEnrolled)
    ? studentsEnrolled.length
    : typeof studentsEnrolled === "number"
      ? studentsEnrolled
      : 0;

  const numericRating = Number.isFinite(Number(__v)) ? Number(__v) : 0;
  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.round(numericRating));

  const categoryLabel =
    typeof category === "string"
      ? category
      : category && (category.name || category.title)
        ? category.name ?? category.title
        : "";

  const displayPrice = (p) => {
    const num = Number(p);
    if (!Number.isNaN(num) && num === 0) return "Free";
    if (!Number.isNaN(num) && num > 0) return `Rs. ${num}`;
    if (typeof p === "string" && p.toLowerCase() === "free") return "Free";
    return p ?? "Free";
  };

  const safeHref = `/courses/${_id ?? id ?? ""}`;

  const timeAgo = formatTimeAgo(updatedAt === null ? createdAt : updatedAt);

  const handleShare = () => {
    copy(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleAddToCart = () => {
    if (user && user?.accountType === ACCOUNT_TYPE.INSTRUCTOR) {
      toast.error("You are an Instructor. You can't buy a course.");
      return;
    }
    if (token) {
      dispatch(setCart(course));
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
    <article
      className="group bg-white rounded-2xl border border-[#efe7ff] shadow-md hover:shadow-2xl overflow-hidden"
      aria-labelledby={`course-details-${_id ?? id}`}
      role="region"
    >
      <div className="relative w-full">
        <div className="h-44 sm:h-56 w-full overflow-hidden bg-gray-50">
          <Img
            src={ThumbnailImage}
            alt={courseName}
            className="w-full h-full object-cover object-center"
            width={640}
            height={360}
          />
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {categoryLabel && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/90 text-[#4c1d95] ring-1 ring-[#e9e0ff] shadow-sm">
              {categoryLabel}
            </span>
          )}
          {duration && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-white/90 text-[#374151] ring-1 ring-[#f1f5f9]">
              {duration}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id={`course-details-${_id ?? id}`} className="text-base font-semibold text-[#0b1220] line-clamp-2">
              {courseName}
            </h2>

            <div className="mt-1 flex items-center gap-3 text-sm text-[#6b7280]">
              <span className="truncate">{instructorName}</span>
              {timeAgo && (
                <>
                  <span aria-hidden="true"> </span>
                  <time dateTime={new Date(updatedAt).toISOString()} className="whitespace-nowrap text-[#9890a7]">
                    Published {timeAgo}
                  </time>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {stars.map((isFilled, i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    className={`w-3.5 h-3.5 ${isFilled ? "text-amber-400" : "text-gray-200"}`}
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M10 15.273l-5.878 3.09 1.123-6.545L.488 7.637l6.573-.957L10 1.5l2.939 5.18 6.573.957-4.757 4.18 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              <div className="text-xs text-[#6b7280]">
                {numericRating?.toFixed?.(1) ?? numericRating} &nbsp;&nbsp;&nbsp; {studentsCount} enrolled
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold">
              <span className="text-sm">{displayPrice(CurrentPrice)}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={
            user && course?.studentsEnrolled?.includes(user?._id)
              ? () => navigate(`/view-course/${course?._id}`)
              : handleBuyCourse
          } className="gap-2 btn-xl btn-purple group/btn btn-border-dark rounded-full">
            {user && course?.studentsEnrolled?.includes(user?._id) ? (
              <span className="inline-flex items-center gap-2 w-[150px]">
                <FaCheck />
                Go To Course
              </span>
            ) : (
              <span className="w-[150px]">{user && CurrentPrice === 0 ? "Enroll" : "Buy Now"}</span>
            )}
          </Button>

          {(!user || !course?.studentsEnrolled?.includes(user?._id)) && (
            <button
              onClick={handleAddToCart}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#efe7ff] bg-white hover:bg-gradient-to-r hover:from-[#7e8694] hover:via-[#8e939e] hover:to-[#a5a9b1] hover:text-white text-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm"
              aria-label="Add to cart"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 transition-transform duration-200 transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
              <span className="whitespace-nowrap">Add to cart</span>
            </button>
          )}
        </div>

        {instructions && instructions.length > 0 && (
          <div className="mt-5 border-t border-[#f3eff9]/30 pt-4">
            <p className="text-sm font-semibold text-[#0b1220] mb-2">Course Requirements</p>
            <div className="flex flex-col gap-2 text-sm text-[#374151]">
              {instructions.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <BsFillCaretRightFill className="mt-1 text-[#7c3aed]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 border-t border-[#f3eff9]/30 pt-3 flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm text-[#0b1220] py-2 px-3 rounded-full bg-white/90 hover:bg-white/95 transition"
            onClick={handleShare}
            aria-label="Share course"
          >
            <FaShareSquare />
            <span className="hidden sm:inline">Share</span>
          </button>

          <div className="text-sm text-[#6b7280]">Secure checkout</div>
        </div>
      </div>
    </article>
  );
}
