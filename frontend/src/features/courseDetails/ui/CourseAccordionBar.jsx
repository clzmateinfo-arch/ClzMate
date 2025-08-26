/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import CourseSubSectionAccordion from "./CourseSubSectionAccordion";
import { IoMdArrowDropdown } from "react-icons/io";

export default function CourseAccordionBar({ course, isActive = [], handleActive }) {
  const contentEl = useRef(null);
  const [sectionHeight, setSectionHeight] = useState(0);
  const active = Array.isArray(isActive) && isActive.includes(course._id);

  useEffect(() => {
    if (!contentEl.current) return;
    const target = active ? contentEl.current.scrollHeight : 0;
    requestAnimationFrame(() => setSectionHeight(target));
  }, [active, course]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm transition">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none transition hover:bg-[#f8f7ff]"
        onClick={() => handleActive(course._id)}
        role="button"
        aria-expanded={active}
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform duration-300 ${active ? "rotate-180" : "rotate-0"
              }`}
            aria-hidden
          >
            <IoMdArrowDropdown size={20} className="text-[#7c3aed]" />
          </span>

          <p className="font-semibold text-[#0b1220]">{course?.sectionName}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold text-sm">
            <span>{course?.subSection?.length ?? 0}</span>
            <span className="text-xs text-[#6b7280]">lecture(s)</span>
          </div>
        </div>
      </div>
      <div
        ref={contentEl}
        className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ height: sectionHeight }}
        aria-hidden={!active}
      >
        <div className="px-5 py-4 space-y-2 bg-white/50 border-t border-[#f3eff9]/30">
          {Array.isArray(course?.subSection) && course.subSection.length > 0 ? (
            course.subSection.map((subSec, i) => (
              <CourseSubSectionAccordion key={subSec._id ?? i} subSec={subSec} />
            ))
          ) : (
            <div className="text-sm text-[#6b7280]">No lectures available in this section.</div>
          )}
        </div>
      </div>
    </div>
  );
}
