/* eslint-disable react/prop-types */
import React from "react";
import { LinkedButton } from "@/shared/components/ui/LinkButton";

function formatTimeAgo(dateLike) {
  if (!dateLike) return null;
  const then = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  if (Number.isNaN(then?.getTime?.())) return null;

  const diffSec = Math.floor((Date.now() - then.getTime()) / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} sec${diffSec === 1 ? "" : "s"} ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
}

export default function CourseCard({ course, onAddToCart = () => { } }) {
  const {
    title,
    instructor,
    img,
    price = "Free",
    duration,
    level,
    rating = 0,
    href = "/courses",
    publishedAt,
  } = course;

  const timeAgo = formatTimeAgo(publishedAt);

  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.round(rating));

  return (
    <article
      className="group bg-white rounded-2xl border border-[#efe7ff] shadow-md hover:shadow-2xl transition transform hover:-translate-y-1 will-change-transform overflow-hidden"
      aria-labelledby={`course-title-${course.id}`}
      role="article"
    >
      <div className="relative w-full">
        <div className="h-44 sm:h-48 w-full overflow-hidden bg-gray-50">
          <img
            src={img}
            alt={title}
            width={640}
            height={360}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          {level && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/90 text-[#4c1d95] ring-1 ring-[#e9e0ff] shadow-sm">
              {level}
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
            <h3
              id={`course-title-${course.id}`}
              className="text-base font-semibold text-[#0b1220] line-clamp-2"
            >
              {title}
            </h3>

            <div className="mt-1 flex items-center gap-3 text-sm text-[#6b7280]">
              <span className="truncate">{instructor}</span>

              {timeAgo && (
                <>
                  <span aria-hidden="true"> </span>
                  <time dateTime={new Date(publishedAt).toISOString()} className="whitespace-nowrap text-[#9890a7]">
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
                {rating?.toFixed?.(1) ?? rating} · {Math.floor(Math.random() * 1000) + 1} enrolled
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold">
              <span className="text-sm">{price}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <LinkedButton to={href} className="gap-2 btn-xl btn-purple group/btn btn-border-dark rounded-full">
            View Course
          </LinkedButton>

          <button
            type="button"
            onClick={() => onAddToCart(course)}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#efe7ff] bg-white hover:bg-gradient-to-r hover:from-[#7e8694] hover:via-[#8e939e] hover:to-[#a5a9b1] hover:text-white text-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.02] shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#996bec]/40 group"
            aria-label={`Add ${title} to cart`}
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
        </div>
      </div>
    </article>
  );
}
