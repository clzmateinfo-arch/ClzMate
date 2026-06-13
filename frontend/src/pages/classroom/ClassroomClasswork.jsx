import { useState } from "react";
import { useParams } from "react-router-dom";
import DashboardHeader from "@/shared/components/ui/DashboardHeader";
import TopicList from "@/features/classroom/ui/Topic/TopicList";
import backImg from "@/shared/assets/images/course_catlog/default-cover.webp";

export default function ClassroomClasswork() {
    const { classroomId } = useParams();
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="bg-transparent text-[#0b1220] min-h-screen pb-12">
            <DashboardHeader
                title="Classwork"
                subtitle="Topics, assignments and materials"
                background={backImg}
                showSearch
                onSearch={(term) => setSearchTerm(term || "")}
            />

            <div className="mx-auto w-11/12 max-w-maxContent mt-8 xl:max-w-[60%] lg:max-w-[85%] md:max-w-[95%] sm:max-w-[100%]">
                <div className="space-y-6 rounded-2xl border border-white/8 bg-white/6 p-2">
                    <TopicList classroomId={classroomId} onOpenTopic={() => { }} search={searchTerm} />
                </div>
            </div>
        </div>
    );
}
