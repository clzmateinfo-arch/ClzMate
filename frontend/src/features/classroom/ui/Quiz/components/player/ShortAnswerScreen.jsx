import { useEffect, useState } from "react";
import IconBtn from "@/shared/components/ui/IconBtn";

/**
 * ShortAnswerScreen - polished textarea + submit
 * Props:
 *  - initial: string
 *  - disabled: bool
 *  - onSubmit(value)
 */
export default function ShortAnswerScreen({ initial = "", disabled = false, onSubmit = () => { } }) {
    const [val, setVal] = useState(initial || "");

    useEffect(() => {
        setVal(initial || "");
    }, [initial]);

    return (
        <div className="space-y-4">
            <label className="text-sm mt-3 mb-1 text-slate-600">Your answer</label>
            <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                disabled={disabled}
                className="w-full p-3 mt-3 mb-1 border border-slate-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                rows={4}
                placeholder="Type your answer..."
            />
            <div className="flex items-center justify-end gap-3 mt-3 mb-1">
                <IconBtn text="Cancel" onClick={() => setVal("")} outline={true} />
                <IconBtn text="Submit" onClick={() => onSubmit(val)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white" disabled={disabled || !val.trim()} />
            </div>
        </div>
    );
}
