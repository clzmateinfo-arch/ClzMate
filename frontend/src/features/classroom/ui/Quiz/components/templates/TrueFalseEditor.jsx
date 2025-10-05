import React from "react";
import Textarea from "@/shared/components/ui/Textarea";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

export default function TrueFalseEditor({ screen = {}, onChange = () => { } }) {
    const local = screen;
    const properties = local.properties || { points: 1, timeLimit: 0 };

    const update = (patch) => onChange({ ...local, ...patch });

    const setCorrect = (isTrue) =>
        onChange({
            ...local,
            options: [{ text: "True", correct: isTrue }, { text: "False", correct: !isTrue }],
        });

    const trueSelected = !!local.options?.find((o) => /^true$/i.test(String(o.text)))?.correct;
    const falseSelected = !!local.options?.find((o) => /^false$/i.test(String(o.text)))?.correct;

    const selectedBtnCls = "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300";

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    label="Question"
                    value={local.body || ""}
                    onChange={(e) => update({ body: e.target.value })}
                    rows={3}
                    placeholder="Write the statement..."
                />
            </div>

            <div className="flex items-center gap-3 my-3">
                <Button
                    type="button"
                    variant="light"
                    onClick={() => setCorrect(true)}
                    className={trueSelected ? selectedBtnCls : ""}
                    aria-pressed={trueSelected}
                >
                    Mark True
                </Button>

                <Button
                    type="button"
                    variant="light"
                    onClick={() => setCorrect(false)}
                    className={falseSelected ? selectedBtnCls : ""}
                    aria-pressed={falseSelected}
                >
                    Mark False
                </Button>
            </div>

            <div className="rounded-xl my-3 border-neutral-100 p-4 bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#0b1220] mb-1">Points</label>
                        <Input
                            type="number"
                            value={properties.points ?? 1}
                            onChange={(e) =>
                                update({ properties: { ...(properties || {}), points: Number(e.target.value) } })
                            }
                            inputClass="py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[#0b1220] mb-1">Time limit (seconds)</label>
                        <Input
                            type="number"
                            value={properties.timeLimit ?? ""}
                            onChange={(e) =>
                                update({ properties: { ...(properties || {}), timeLimit: Number(e.target.value) } })
                            }
                            inputClass="py-2"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
