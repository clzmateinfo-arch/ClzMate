import React from "react";
import Textarea from "@/shared/components/ui/Textarea";
import Input from "@/shared/components/ui/Input";
import Select from "@/shared/components/ui/Select";
import Button from "@/shared/components/ui/Button";

export default function SliderEditor({ screen = {}, onChange = () => { } }) {
    const local = screen;
    const properties = local.properties || {
        min: 0,
        max: 100,
        step: 1,
        points: 1,
        timeLimit: 0,
    };

    const hasCustomBorderColor = !!(local.borderColor || properties.borderColor);

    const update = (patch) => onChange({ ...local, ...patch });

    const updateProps = (patch) => update({ properties: { ...(properties || {}), ...patch } });

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    label="Question"
                    value={local.body || ""}
                    onChange={(e) => update({ body: e.target.value })}
                    rows={3}
                    placeholder="Write the question..."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div
                    className={`lg:col-span-2 rounded-xl p-4 mt-3 mb-1 bg-white shadow-sm ${hasCustomBorderColor ? "" : "border-neutral-300"
                        }`}
                    style={local.borderColor ? { boxShadow: "none" } : undefined}
                >
                    <div className="text-sm font-semibold mb-3">Slider range</div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Min</label>
                            <Input
                                type="number"
                                value={properties.min ?? 0}
                                onChange={(e) => updateProps({ min: Number(e.target.value) })}
                                inputClass="py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Max</label>
                            <Input
                                type="number"
                                value={properties.max ?? 100}
                                onChange={(e) => updateProps({ max: Number(e.target.value) })}
                                inputClass="py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Step</label>
                            <Input
                                type="number"
                                value={properties.step ?? 1}
                                onChange={(e) => updateProps({ step: Number(e.target.value) })}
                                inputClass="py-2"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Default value (optional)</label>
                        <Input
                            type="number"
                            value={properties.default ?? ""}
                            onChange={(e) => updateProps({ default: e.target.value === "" ? undefined : Number(e.target.value) })}
                            inputClass="py-2"
                        />
                    </div>
                </div>

                <div
                    className={`rounded-xl p-4 mt-3 mb-1 bg-white shadow-sm space-y-3 ${hasCustomBorderColor ? "" : "border-neutral-300"
                        }`}
                >
                    <div className="mb-1">
                        <label className="block text-sm font-medium mb-1">Points</label>
                        <Input
                            type="number"
                            value={properties.points ?? 1}
                            onChange={(e) => updateProps({ points: Number(e.target.value) })}
                            inputClass="py-2"
                        />
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium mb-1">Time limit (seconds)</label>
                        <Input
                            type="number"
                            value={properties.timeLimit ?? ""}
                            onChange={(e) => updateProps({ timeLimit: Number(e.target.value) })}
                            inputClass="py-2"
                        />
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium mb-1">Visual style</label>
                        <Select
                            options={[
                                { value: "default", label: "Default" },
                                { value: "compact", label: "Compact" },
                                { value: "expanded", label: "Expanded" },
                            ]}
                            value={properties.style || "default"}
                            onChange={(e) => updateProps({ style: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
