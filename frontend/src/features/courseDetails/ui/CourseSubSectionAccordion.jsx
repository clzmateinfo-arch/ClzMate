/* eslint-disable react/prop-types */
import { HiOutlineVideoCamera } from "react-icons/hi";
import { FaFileVideo, FaVideo } from "react-icons/fa6";
import { IoIosDocument } from "react-icons/io";

export default function CourseSubSectionAccordion({ subSec = {} }) {
  const { title, duration, supportMaterials = [] } = subSec;

  const hasMainPdf = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainPdf);
  const hasMainVideo = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainVideo);
  const hasMainHtml = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainHtml);

  const showPreview = hasMainVideo;
  const showHtml = hasMainHtml && !hasMainVideo && !hasMainPdf;
  const showDoc = hasMainPdf && !hasMainVideo && !hasMainHtml;
  const showLocked = !showPreview && !showHtml && !showDoc;

  return (
    <div
      className="w-full rounded-lg border border-[#f3eff9]/30 bg-white p-3 mt-1 transition hover:shadow-sm flex items-center justify-between"
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

      <div name="indicator" className="flex items-center gap-3">
        {showPreview ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] text-xs font-semibold">
            <FaVideo className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Prev</span>
          </div>
        ) : showHtml ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] text-xs font-semibold">
            <IoIosDocument className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">HTML</span>
          </div>
        ) : showLocked ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] text-xs font-semibold">
            <FaFileVideo className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Doc + Prev</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 text-[#4c1d95] text-xs font-semibold">
            <IoIosDocument className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Doc</span>
          </div>
        )}
      </div>
    </div>
  );
}
