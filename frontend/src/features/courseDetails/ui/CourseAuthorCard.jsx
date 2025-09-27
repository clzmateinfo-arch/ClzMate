/* eslint-disable react/prop-types */
import React from "react";
import { MdOutlineVerified } from "react-icons/md";
import { Link } from "react-router-dom";
import Img from "@/shared/components/ui/Img";

export default function CourseAuthorCard({
    instructor = {},
    className = "",
    onViewProfile = () => { },
}) {
    const {
        preferredName = "",
        image,
        title,
        additionalDetails = {},
        isVerified = false,
        socials = {},
    } = instructor || {};

    const profileUrl = socials.linkedin ?? socials.website ?? "#";

    return (
        <aside
            className={`bg-white rounded-2xl border border-[#efe7ff] shadow-md p-6 mt-8 shadow-md hover:shadow-2xl overflow-hidden ${className}`}
            aria-label="Course author"
        >
            <h3 className="text-lg font-semibold text-[#0b1220]">Author</h3>

            <div className="flex items-start gap-4 mt-4">
                <div className="flex-shrink-0">
                    <Img
                        src={image}
                        alt={preferredName || "Author"}
                        className="h-16 w-16 rounded-full object-cover border ring-1 ring-[#f3eff9]/50"
                    />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-base font-semibold text-[#0b1220] truncate">
                            {preferredName || "Unknown Author"}
                        </p>

                        {isVerified && (
                            <span className="inline-flex items-center text-sm text-sky-600" title="Verified instructor" aria-hidden>
                                <MdOutlineVerified className="w-5 h-5" />
                            </span>
                        )}
                    </div>

                    {title && <p className="text-sm text-[#6b7280] mt-1">{title}</p>}

                    {additionalDetails?.about && (
                        <p className="text-sm text-[#374151] mt-3 line-clamp-3">{additionalDetails.about}</p>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onViewProfile(instructor)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#ba7bf0] to-[#996bec] text-white text-sm font-semibold shadow-sm hover:brightness-95 transition"
                        >
                            View profile
                        </button>

                        <Link
                            to={profileUrl}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/6 text-[#4c1d95] text-sm font-medium hover:bg-white/8 transition"
                            aria-label="Author website or LinkedIn"
                        >
                            Profile
                        </Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
