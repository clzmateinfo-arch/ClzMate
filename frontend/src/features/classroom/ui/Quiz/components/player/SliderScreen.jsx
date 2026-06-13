import { useEffect, useState } from "react";
import IconBtn from "@/shared/components/ui/IconBtn";

/**
 * SliderScreen - polished range input with value badge
 * Props:
 *  - screen: contains properties: min,max,step,default
 *  - value: initial value
 *  - disabled: bool
 *  - onSubmit(value)
 */
export default function SliderScreen({ screen = {}, value = null, disabled = false, onSubmit = () => { } }) {
    const props = screen.properties || {};
    const min = Number(props.min ?? 0);
    const max = Number(props.max ?? 100);
    const step = Number(props.step ?? 1);
    const defaultVal = Number(props.default ?? min);
    const [v, setV] = useState(value ?? defaultVal);

    useEffect(() => {
        setV(value ?? defaultVal);
    }, [value, screen]);

    return (
        <div className="space-y-4">
            <div className="px-4 py-3 mt-3 mb-1 rounded-lg bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-slate-600">Adjust value</div>
                    <div className="text-sm font-semibold text-slate-900">{v}</div>
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={v}
                    onChange={(e) => setV(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 accent-indigo-600"
                />

                <div className="mt-2 text-xs text-slate-400">
                    Range: {min} — {max} (step {step})
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-3 mb-1">
                <IconBtn text="Reset" onClick={() => setV(defaultVal)} outline={true} />
                <IconBtn text="Submit" onClick={() => onSubmit(v)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white" disabled={disabled} />
            </div>
        </div>
    );
}
