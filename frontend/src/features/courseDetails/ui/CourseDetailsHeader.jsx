/* eslint-disable react/prop-types */
import React from "react";
import { BiInfoCircle } from "react-icons/bi";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import { formatDate } from "@/shared/utils/formatDate";

/**
 * CourseDetailsHeader — responsive fixes for tablet & mobile alignment
 */
export default function CourseDetailsHeader({
  courseName = null,
  courseDescription = null,
  createdAt = null,
  language = "English",
  whatYouWillLearn = null,
}) {
  const learnList = Array.isArray(whatYouWillLearn)
    ? whatYouWillLearn
    : typeof whatYouWillLearn === "string" && whatYouWillLearn.length
    ? whatYouWillLearn.split("\n").filter(Boolean)
    : [];

  return (
    <header className="mb-6">
      <div className="bg-white rounded-2xl border border-[#efe7ff] shadow-md p-6 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Title + Description + meta */}
          <div className="md:col-span-8">
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#0b1220] leading-tight"
              aria-label={courseName}
            >
              {courseName}
            </h1>

            {courseDescription && (
              <p className="text-sm md:text-base text-[#6b7280] mt-2 md:mt-3">{courseDescription}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-3 items-center text-sm">
              <div className="inline-flex items-center gap-2 text-[#6b7280]">
                <BiInfoCircle className="w-5 h-5" />
                <span className="whitespace-nowrap text-sm">Created at {formatDate(createdAt)}</span>
              </div>

              <div className="inline-flex items-center gap-2 text-[#6b7280]">
                <HiOutlineGlobeAlt className="w-5 h-5" />
                <span className="whitespace-nowrap text-sm">{language}</span>
              </div>
            </div>
          </div>

          {/* Right: badge area — appears top-right on md+, stacks below on mobile */}
          <div className="md:col-span-4 flex md:items-start md:justify-end items-center justify-start order-last md:order-none">
            <div className="text-right md:ml-0 w-full md:w-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold text-sm">
                Course Info
              </div>
            </div>
          </div>

          {/* Full-width: What you will learn */}
          <div className="md:col-span-12 mt-2">
            <h2 className="text-lg md:text-xl font-semibold text-[#0b1220]">What you will learn</h2>

            {learnList.length === 0 ? (
              <p className="text-sm text-[#6b7280] mt-3">No learning outcomes provided.</p>
            ) : (
              <div className="mt-3 grid gap-3">
                {learnList.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-white/50 rounded-lg p-3 border border-[#f3eff9]/30"
                  >
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] font-semibold text-sm">
                        {idx + 1}
                      </span>
                    </div>

                    <p className="text-sm md:text-base text-[#374151] mt-0.5">{line}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
