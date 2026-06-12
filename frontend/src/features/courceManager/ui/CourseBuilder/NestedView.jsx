/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import { HiOutlineVideoCamera } from "react-icons/hi";
import { IoIosDocument } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaPlus } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { deleteSection, deleteSubSection } from "@/entities/course/model/courseDetailsAPI";
import { setCourse } from "@/entities/course/model/courseSlice";
import ConfirmationModal from "@/shared/components/feedback/ConfirmationModal";
import SubSectionModal from "./SubSectionModal";
import { useLocation } from "react-router-dom";
import { FaFileVideo, FaVideo } from "react-icons/fa6";

function EditableSubSection({ subSec, onView, onEdit, onDelete }) {
  const { title, duration, supportMaterials = [] } = subSec ?? {};

  const hasMainPdf = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainPdf);
  const hasMainVideo = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainVideo);
  const hasMainHtml = Array.isArray(supportMaterials) && supportMaterials.some((m) => !!m.isMainHtml);

  const showPreview = hasMainVideo;
  const showHtml = hasMainHtml && !hasMainVideo && !hasMainPdf;
  const showDoc = hasMainPdf && !hasMainVideo && !hasMainHtml;
  const showLocked = !showPreview && !showHtml && !showDoc;

  return (
    <div
      className="w-full rounded-lg border border-[#f3eff9]/30 bg-white p-3 mt-1 transition hover:shadow-sm flex items-center justify-between cursor-pointer"
      role="listitem"
      aria-label={title}
      onClick={() => onView && onView(subSec)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-[#ba7bf0]/10 to-[#996bec]/10 text-[#4c1d95]">
          <HiOutlineVideoCamera className="w-5 h-5" aria-hidden />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0b1220] line-clamp-2 truncate">{title}</p>
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

        <div className="flex items-center gap-2 ml-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(subSec);
            }}
            aria-label="Edit lecture"
            className="p-2 rounded hover:bg-white/8"
            title="Edit lecture"
          >
            <MdEdit className="text-lg text-[#0b1220]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(subSec);
            }}
            aria-label="Delete lecture"
            className="p-2 rounded hover:bg-white"
            title="Delete lecture"
          >
            <RiDeleteBin6Line className="text-lg text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionItem({
  section,
  isOpen,
  onToggle,
  onEditSection,
  onDeleteSection,
  onAddLecture,
  onViewLecture,
  onEditLecture,
  onDeleteLecture,
}) {
  const loc = useLocation();
  const contentRef = useRef(null);
  const [sectionHeight, setSectionHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;
    const target = isOpen ? contentRef.current.scrollHeight : 0;
    requestAnimationFrame(() => setSectionHeight(target));
  }, [isOpen, section, loc.pathname]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#efe7ff] bg-white shadow-sm transition my-3">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none transition hover:bg-[#f8f7ff]"
        onClick={() => onToggle(section._id)}
        role="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
            aria-hidden
          >
            <IoMdArrowDropdown size={20} className="text-[#7c3aed]" />
          </span>

          <p className="font-semibold text-[#0b1220] min-w-0 truncate">{section.sectionName}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0]/15 to-[#996bec]/10 ring-1 ring-[#e9defc] text-[#4c1d95] font-semibold text-sm">
            <span>{section?.subSection?.length ?? 0}</span>
            <span className="text-xs text-[#6b7280]">lecture(s)</span>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSection(section._id, section.sectionName);
              }}
              title="Edit section"
              className="p-2 rounded hover:bg-white/8"
            >
              <MdEdit className="text-lg text-[#0b1220]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSection(section._id);
              }}
              title="Delete section"
              className="p-2 rounded hover:bg-white/8"
            >
              <RiDeleteBin6Line className="text-lg text-red-600" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ height: sectionHeight }}
        aria-hidden={!isOpen}
      >
        <div className="px-5 py-4 space-y-3 bg-white/50 border-t border-[#f3eff9]/30">
          {Array.isArray(section.subSection) && section.subSection.length > 0 ? (
            section.subSection.map((sub) => (
              <EditableSubSection
                key={sub._id}
                subSec={sub}
                onView={(s) => onViewLecture(s)}
                onEdit={(s) => onEditLecture(s, section._id)}
                onDelete={(s) => onDeleteLecture(s, section._id)}
              />
            ))
          ) : (
            <div className="text-sm text-[#6b7280]">No lectures available in this section.</div>
          )}

          <div className="flex items-center justify-between my-3">
            <button
              type="button"
              onClick={() => onAddLecture(section._id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-violet-50 text-violet-600 font-semibold text-sm"
            >
              <FaPlus /> <span>Add Lecture</span>
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => onEditSection(section._id, section.sectionName)}
                title="Edit section"
                className="p-2 rounded hover:bg-white/8"
              >
                <MdEdit className="text-lg text-[#0b1220]" />
              </button>

              <button
                type="button"
                onClick={() => onDeleteSection(section._id)}
                title="Delete section"
                className="p-2 rounded hover:bg-white/8"
              >
                <RiDeleteBin6Line className="text-lg text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NestedView({ handleChangeEditSectionName }) {
  const { course } = useSelector((state) => state.course);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const loc = useLocation();

  const [activeSections, setActiveSections] = useState([]);
  const [addSubSection, setAddSubsection] = useState(null);
  const [viewSubSection, setViewSubSection] = useState(null);
  const [editSubSection, setEditSubSection] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  useEffect(() => {
    setActiveSections([]);
  }, [course?._id, loc.pathname]);

  const handleToggle = useCallback((sectionId) => {
    setActiveSections((prev) => {
      const has = prev.includes(sectionId);
      return has ? prev.filter((id) => id !== sectionId) : [...prev, sectionId];
    });
  }, []);

  const handleDeleteSection = async (sectionId) => {
    const result = await deleteSection({ sectionId, courseId: course._id, token });
    if (result) {
      dispatch(setCourse(result));
      setActiveSections((s) => s.filter((id) => id !== sectionId));
    } else {
      console.error("Failed to delete section");
    }
    setConfirmationModal(null);
  };

  const handleDeleteSubSection = async (subSecOrObj, sectionId) => {
    const subSectionId = subSecOrObj?._id ?? subSecOrObj;
    const result = await deleteSubSection({ subSectionId, sectionId, token });
    if (result) {
      const updatedCourseContent = course.courseContent.map((sec) => (sec._id === sectionId ? result : sec));
      dispatch(setCourse({ ...course, courseContent: updatedCourseContent }));
    } else {
      console.error("Failed to delete lecture");
    }
    setConfirmationModal(null);
  };

  const confirmDeleteSection = (sectionId) => {
    setConfirmationModal({
      text1: "Delete this Section?",
      text2: "All lectures in this section will be deleted",
      btn1Text: "Delete",
      btn2Text: "Cancel",
      btn1Handler: () => handleDeleteSection(sectionId),
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  const confirmDeleteSubSection = (sub, sectionId) => {
    setConfirmationModal({
      text1: "Delete this Sub-Section?",
      text2: "This lecture will be deleted",
      btn1Text: "Delete",
      btn2Text: "Cancel",
      btn1Handler: () => handleDeleteSubSection(sub, sectionId),
      btn2Handler: () => setConfirmationModal(null),
    });
  };

  return (
    <>
      <div className="space-y-4">
        {Array.isArray(course?.courseContent) && course.courseContent.length > 0 ? (
          course.courseContent.map((section, i) => {
            const id = section._id ?? `section-${i}`;
            const open = activeSections.includes(id);

            return (
              <SectionItem
                key={id}
                section={section}
                isOpen={open}
                onToggle={() => handleToggle(id)}
                onEditSection={(sectionId, sectionName) => handleChangeEditSectionName(sectionId, sectionName)}
                onDeleteSection={(sectionId) => confirmDeleteSection(sectionId)}
                onAddLecture={(sectionId) => setAddSubsection(sectionId)}
                onViewLecture={(sub) => setViewSubSection(sub)}
                onEditLecture={(sub, sectionId) => setEditSubSection({ ...sub, sectionId })}
                onDeleteLecture={(sub, sectionId) => confirmDeleteSubSection(sub, sectionId)}
              />
            );
          })
        ) : (
          <div className="text-sm text-[#6b7280]">No sections added yet.</div>
        )}
      </div>

      {addSubSection && <SubSectionModal modalData={addSubSection} setModalData={setAddSubsection} add />}
      {viewSubSection && <SubSectionModal modalData={viewSubSection} setModalData={setViewSubSection} view />}
      {editSubSection && <SubSectionModal modalData={editSubSection} setModalData={setEditSubSection} edit />}
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
