import { FiTrash2 } from "react-icons/fi";
import Textarea from "@/shared/components/ui/Textarea";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import IconBtn from "@/shared/components/ui/IconBtn";
import Select from "@/shared/components/ui/Select";

export default function MultipleEditor({ screen = {}, onChange = () => { } }) {
    const local = screen;
    const opts = Array.isArray(local.options) ? local.options : [];

    const update = (patch) => onChange({ ...local, ...patch });

    const updateOption = (idx, patch) => {
        const copy = opts.map((o) => ({ ...o }));
        copy[idx] = { ...copy[idx], ...patch };
        update({ options: copy });
    };

    const addOption = () =>
        update({ options: [...opts, { text: "", correct: false }] });

    const removeOption = (idx) => {
        const copy = [...opts];
        copy.splice(idx, 1);
        update({ options: copy });
    };

    const properties = local.properties || { points: 1, timeLimit: 0, answerMode: "single" };

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    label="Question"
                    value={local.body || ""}
                    onChange={(e) => update({ body: e.target.value })}
                    rows={4}
                    placeholder="Write the question..."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-3 rounded-xl border-neutral-300 mt-2 p-4 bg-white shadow-sm hover:shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Options</div>
                        <Button variant="light" onClick={addOption} className="text-sm">
                            Add option
                        </Button>
                    </div>

                    <div className="space-y-2 mt-2">
                        {opts.length === 0 && (
                            <div className="text-sm text-slate-500">No options yet   add one.</div>
                        )}

                        {opts.map((o, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-2 rounded-md border-neutral-300 hover:shadow-sm"
                            >
                                <label className="flex items-center gap-2">
                                    <input
                                        type={properties.answerMode === "multiple" ? "checkbox" : "radio"}
                                        checked={!!o.correct}
                                        onChange={(e) => updateOption(i, { correct: e.target.checked })}
                                        className="w-4 h-4"
                                        name={`opt-correct-${local._id || local.id || "quiz"}`}
                                    />
                                </label>

                                <div className="flex-1">
                                    <Input
                                        value={o.text}
                                        onChange={(e) => updateOption(i, { text: e.target.value })}
                                        placeholder={`Option ${i + 1}`}
                                        inputClass="py-2"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <IconBtn
                                        onClick={() => removeOption(i)}
                                        outline
                                        className="px-3 py-2"
                                        text=""
                                        aria-label={`Remove option ${i + 1}`}
                                    >
                                        <FiTrash2 />
                                    </IconBtn>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border-neutral-300 mt-2 p-4 bg-white shadow-sm ">
                    <div className="space-y-3">
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
                            <label className="block text-sm font-semibold text-[#0b1220] mb-1 mt-3">Time limit (seconds)</label>
                            <Input
                                type="number"
                                value={properties.timeLimit ?? ""}
                                onChange={(e) =>
                                    update({ properties: { ...(properties || {}), timeLimit: Number(e.target.value) } })
                                }
                                inputClass="py-2"
                            />
                        </div>

                        <div className="mt-3 mb-1">
                            <Select
                                label="Answer mode"
                                options={[
                                    { value: "single", label: "Single" },
                                    { value: "multiple", label: "Multiple" },
                                ]}
                                value={properties.answerMode || "single"}
                                onChange={(e) =>
                                    update({ properties: { ...(properties || {}), answerMode: e.target.value } })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
