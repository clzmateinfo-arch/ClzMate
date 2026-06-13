 
import { RxCross2 } from "react-icons/rx";

export default function CourseTipsDialog({ open, onClose }) {
    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Course upload tips"
            className="fixed inset-0 z-[1100] flex items-center justify-center px-4 py-8"
        >
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden
            />
            <div className="relative z-[1110] w-full max-w-2xl rounded-2xl border border-white/8 bg-white/90 p-6 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-richblack-900">Course Upload Tips</h3>
                            <p className="mt-1 text-sm text-richblack-600">Quick tips to help you get the most from your course listing.</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close tips"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-richblack-600 hover:bg-white/8 focus:outline-none"
                        title="Close"
                    >
                        <RxCross2 className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-6 grid gap-3">
                    <ul className="grid gap-3">
                        <li className="flex gap-3">
                            <div className="flex-none mt-1 w-8 h-8 grid place-items-center rounded-md bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">✓</div>
                            <div>
                                <p className="text-sm font-medium text-richblack-900">Set pricing thoughtfully</p>
                                <p className="text-xs text-richblack-600">Define whether the course should be free or paid depending on target learners and depth of content.</p>
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <div className="flex-none mt-1 w-8 h-8 grid place-items-center rounded-md bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">🖼️</div>
                            <div>
                                <p className="text-sm font-medium text-richblack-900">Thumbnail recommendation</p>
                                <p className="text-xs text-richblack-600">Use 1024×576 (16:9) for best visuals   choose an informative image that communicates the course topic.</p>
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <div className="flex-none mt-1 w-8 h-8 grid place-items-center rounded-md bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">🎬</div>
                            <div>
                                <p className="text-sm font-medium text-richblack-900">Overview video</p>
                                <p className="text-xs text-richblack-600">Add a short overview video in the video section to increase conversions   keep it under 3 minutes.</p>
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <div className="flex-none mt-1 w-8 h-8 grid place-items-center rounded-md bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">🧭</div>
                            <div>
                                <p className="text-sm font-medium text-richblack-900">Organize with sections</p>
                                <p className="text-xs text-richblack-600">Create clear sections and add at least one lecture per section for a better learner experience.</p>
                            </div>
                        </li>

                        <li className="flex gap-3">
                            <div className="flex-none mt-1 w-8 h-8 grid place-items-center rounded-md bg-gradient-to-br from-[#ba7bf0]/10 to-[#996bec]/10 ring-1 ring-[#996bec]/10 text-[#7C3AED]">📢</div>
                            <div>
                                <p className="text-sm font-medium text-richblack-900">Announcements & extras</p>
                                <p className="text-xs text-richblack-600">Use announcements to inform enrolled students about updates or new content.</p>
                            </div>
                        </li>
                    </ul>

                    <div className="mt-4 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="bg-violet-600 rounded-full px-4 py-2 text-sm text-white font-medium border border-white/8 text-richblack-900 hover:bg-violet-700 transition"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
