/* eslint-disable react/prop-types */
import { HiOutlineVideoCamera } from "react-icons/hi";
import { FaLock } from "react-icons/fa";
import { BsFillCaretRightFill } from "react-icons/bs";

export default function CourseSubSectionAccordion({ subSec = {} }) {
  const { title, duration, isPreview, locked } = subSec;

  return (
    <div
      className="w-full rounded-lg border border-[#f3eff9]/30 bg-white p-3 transition hover:shadow-sm flex items-center justify-between"
      role="listitem"
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
          <HiOutlineVideoCamera className="w-5 h-5" aria-hidden />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0b1220] line-clamp-2">{title}</p>
          {duration && <p className="text-xs text-[#6b7280] mt-0.5">{duration}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isPreview ? (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-xs font-semibold">
            Preview
          </span>
        ) : locked ? (
          <span className="inline-flex items-center gap-2 text-[#9ca3af]" aria-hidden>
            <FaLock />
          </span>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] text-xs font-semibold">
            <BsFillCaretRightFill className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Play</span>
          </div>
        )}
      </div>
    </div>
  );
}
