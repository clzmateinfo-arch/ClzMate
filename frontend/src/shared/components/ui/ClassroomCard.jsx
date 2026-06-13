import { FiUsers, FiClock, FiMoreHorizontal } from "react-icons/fi";
import IconBtn from "@/shared/components/ui/IconBtn";
import { MdContentCopy } from "react-icons/md";

export default function ClassroomCard({ classroom = {}, onOpen = () => { }, onMembers = () => { }, onCopyInvite = () => { }, className = "" }) {
    const {
        _id,
        title,
        description,
        inviteCode,
        members = [],
        owner = {},
        meta = {},
    } = classroom || {};

    const updatedAt = meta?.updatedAt || meta?.createdAt || classroom?.meta?.createdAt || new Date().toISOString();
    const formattedDate = new Date(updatedAt).toLocaleString();

    const ownerName = owner?.firstName ? `${owner.firstName} ${owner.lastName || ""}` : (owner?.email || ",");

    const copyInviteCode = (inviteCode) => {
        if (inviteCode) {
            try {
                navigator.clipboard?.writeText(inviteCode);
            } catch (e) {
                console.warn("ClassroomCard: Clipboard copy failed", e);
            }
            onCopyInvite(inviteCode);
        }
    }

    return (
        <article
            className={`group bg-white/6 border border-white/8 rounded-2xl p-4 shadow-sm hover:shadow-md transition ${className}`}
            aria-labelledby={`classroom-${_id}-title`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                    <h3 id={`classroom-${_id}-title`} className="text-lg font-semibold text-black truncate">
                        {title || "Untitled Classroom"}
                    </h3>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-3 break-words">{description || "No description provided."}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <div className="inline-flex items-center gap-2">
                            <FiUsers className="w-4 h-4" />
                            <span>{(members || []).length} members</span>
                        </div>

                        <div className="inline-flex items-center gap-2 ">
                            <FiClock className="w-4 h-4" />
                            <time dateTime={new Date(updatedAt).toISOString()}>{formattedDate}</time>
                        </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                        <div className="ml-auto text-left">
                            <div className="text-[11px]">Owner: {ownerName}</div>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c6e86] to-[#747297] flex items-center justify-center text-white ring-1 ring-white/6">
                        <span className="font-semibold">{(title || "C").charAt(0).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div
                        className="px-2 py-1 bg-white/6 rounded text-xs font-mono text-slate-500"
                        onClick={() => copyInviteCode(inviteCode)}
                    >{inviteCode || ","}</div>
                    <button
                        onClick={() => copyInviteCode(inviteCode)}
                        type="button"
                    >
                        <MdContentCopy />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <IconBtn
                        text=""
                        onClick={() => onMembers(classroom)}
                        className="px-3 py-2 bg-white/6"
                        customClasses="!px-3 !py-2"
                        textClass="text-black"
                    >
                        <span className="text-sm">Members</span>
                    </IconBtn>

                    <IconBtn
                        text=""
                        onClick={() => onOpen(classroom)}
                        className="px-3 py-2 bg-violet-600"
                        customClasses="!px-3 !py-2"
                    >
                        <span className="text-sm">Open</span>
                    </IconBtn>

                    <button
                        type="button"
                        aria-label="more"
                        className="inline-flex items-center justify-center p-2 rounded-md text-slate-900 hover:bg-white/4"
                    >
                        <FiMoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </article>
    );
}
