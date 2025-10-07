export default function AnnouncementCard({ announcement = {} }) {
    const title = announcement.title || "Announcement";
    const body = announcement.body || "";
    const date = announcement.date ? new Date(announcement.date).toLocaleString() : null;

    return (
        <div className="rounded-lg border p-3 bg-white">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{title}</div>
                    {body ? <div className="text-xs text-slate-500 mt-1 line-clamp-3">{body}</div> : null}
                    {date ? <div className="text-xs text-slate-400 mt-2">{date}</div> : null}
                </div>
            </div>
        </div>
    );
}
