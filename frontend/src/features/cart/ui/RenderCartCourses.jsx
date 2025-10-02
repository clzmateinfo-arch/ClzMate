// frontend/src/features/cart/ui/RenderCartCourses.jsx
import React from "react";
import { FaStar } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import ReactStars from "react-rating-stars-component";
import { removeCourseFromCart } from "@/entities/cart/model/cartAPI";
import { removeFromCartLocal } from "@/entities/cart/model/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import Img from "@/shared/components/ui/Img";
import { Link } from "react-router-dom";

export default function RenderCartCourses() {
  const { cart } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth || {});
  const dispatch = useDispatch();

  return (
    <div className="flex flex-1 flex-col">
      {cart.map((course, indx) => (
        <div
          key={course._id}
          className={`flex w-full flex-wrap items-start justify-between gap-6 ${indx !== cart.length - 1 ? "border-b border-b-black pb-6" : ""
            } ${indx !== 0 ? "mt-6" : ""}`}
        >
          <div className="flex flex-1 flex-col gap-4 xl:flex-row">
            {/* course thumbnail */}
            <Img
              src={course?.thumbnail}
              alt={course?.courseName}
              className="h-[148px] w-[220px] rounded-lg object-cover"
            />

            <div className="flex flex-col space-y-1">
              <Link to={`/course/${course._id}`} className="text-lg font-medium text-black hover:underline">
                {course?.courseName}
              </Link>
              <p className="text-sm text-black">{course?.category?.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-yellow-5">4.5</span>
                <ReactStars
                  count={5}
                  value={
                    // prefer average rating if provided, else length fallback
                    course?.rating ?? course?.ratingAndReviews?.length ?? 0
                  }
                  size={20}
                  edit={false}
                  activeColor="#ffd700"
                  emptyIcon={<FaStar />}
                  fullIcon={<FaStar />}
                />
                <span className="text-black">
                  {course?.ratingAndReviews?.length ?? 0} Ratings
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={() => {
                if (token) {
                  dispatch(removeCourseFromCart(token, course._id));
                } else {
                  dispatch(removeFromCartLocal(course._id));
                }
              }}
              className="flex items-center gap-x-1 rounded-md border border-black py-3 px-[12px] text-pink-200"
            >
              <RiDeleteBin6Line />
              <span>Remove</span>
            </button>
            <p className="mb-6 text-3xl font-medium text-yellow-100">
              ₹ {Number(course?.price ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
