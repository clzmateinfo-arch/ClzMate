/* eslint-disable react/prop-types */
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, FreeMode } from "swiper/modules";
import { useEffect, useState } from "react";
import Img from "@/shared/components/ui/Img";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { ratingsEndpoints } from "@/app/config/apis";


function Stars({ rating = 0, size = 16 }) {
  const numeric = Math.round(Number(rating) || 0);
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < numeric;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={`w-${Math.round(size / 4)} h-${Math.round(size / 4)} ${filled ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 15.273l-5.878 3.09 1.123-6.545L.488 7.637l6.573-.957L10 1.5l2.939 5.18 6.573.957-4.757 4.18 1.123 6.545z" />
          </svg>
        );
      })}
    </div>
  );
}

export default function ReviewSlider() {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const truncateWords = 18;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiConnector("GET", ratingsEndpoints.REVIEWS_DETAILS_API);
        if (cancelled) return;
        if (data?.success) {
          setReviews(Array.isArray(data.data) ? data.data : []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
        setError("Could not load reviews");
        setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  if (!reviews || reviews.length === 0) return null;

  return (
    <div className="text-black">
      <div className="my-[30px] max-w-maxContent mx-auto">
        <Swiper
          modules={[Autoplay, FreeMode]}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1400: { slidesPerView: 4 },
          }}
          spaceBetween={20}
          loop={true}
          freeMode={true}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          className="w-full"
        >
          {reviews.map((review, i) => {
            const user = review?.user || {};
            const course = review?.course || {};
            const avatar =
              user?.image ||
              `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
                `${user?.firstName ?? ""} ${user?.lastName ?? ""}`
              )}`;

            const text = String(review?.review || "");
            const truncated =
              text.split(" ").length > truncateWords
                ? `${text.split(" ").slice(0, truncateWords).join(" ")}...`
                : text;

            const rating = review?.rating ?? 0;

            return (
              <SwiperSlide key={i}>
                <article
                  className="flex flex-col gap-3 p-4 min-h-[180px] max-h-[220px] rounded-2xl
                             bg-white/6 backdrop-blur-md border border-white/8 text-black shadow-sm"
                  aria-labelledby={`review-${i}-title`}
                >
                  <header className="flex items-center gap-3">
                    <Img src={avatar} alt={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} className="h-11 w-11 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 id={`review-${i}-title`} className="font-semibold text-base text-black truncate">
                        {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Anonymous"}
                      </h4>
                      <div className="text-sm text-richblack-300 truncate">{course?.courseName ?? "—"}</div>
                    </div>
                  </header>

                  <p className="text-sm text-richblack-200 font-medium">{truncated}</p>

                  <footer className="mt-auto flex items-center justify-start gap-3">
                    <div className="inline-flex items-center gap-2">
                      <span className="font-semibold text-yellow-100">{rating}</span>
                      <Stars rating={rating} size={14} />
                    </div>
                  </footer>
                </article>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </div>
  );
}
