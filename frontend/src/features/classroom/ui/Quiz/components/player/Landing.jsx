import { FiClock } from "react-icons/fi";
import IconBtn from "@/shared/components/ui/IconBtn";

export default function Landing({ quiz = {}, onStart = () => { }, onBack = () => { } }) {

    const totalPoints = (quiz?.screens || []).reduce((sum, s) => sum + (Number(s?.properties?.points) || 0), 0);

    return (
        <div className="fixed inset-0 z-[1000] bg-gradient-to-br from-indigo-600 to-pink-500 text-white flex items-center justify-center p-4">
            <div className="max-w-3xl w-full rounded-2xl bg-black/30 backdrop-blur-md p-8 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-3xl font-extrabold tracking-tight">
                            {quiz.title} <span className="ml-2">🎮</span>
                        </div>
                        <div className="text-sm mt-2 text-white/90">{quiz.description}</div>

                        <div className="mt-4 flex items-center gap-3 text-sm">
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                <FiClock />
                                {totalPoints ?? 0} points
                            </div>
                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                                <span className="font-semibold">{quiz.screens?.length ?? 0}</span> questions
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <IconBtn
                            text="Start quiz 🚀"
                            onClick={onStart}
                            className="px-5 py-3 bg-white/10 text-black font-semibold"
                        />
                    </div>
                </div>

                <div className="mt-6 text-xs text-white/80">
                    Tip: Each question has its own timer. If you don't answer, the quiz will automatically proceed
                </div>
                <div className="w-full justify-end align-baseline mt-3 mb-1">
                    <IconBtn
                        text="Back"
                        onClick={onBack}
                        className="px-5 py-3 bg-white/10 text-black font-semibold"
                    />
                </div>
            </div>
        </div>
    );
}
