import { FiTrash2 } from "react-icons/fi";
import Textarea from "@/shared/components/ui/Textarea";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import IconBtn from "@/shared/components/ui/IconBtn";
import Select from "@/shared/components/ui/Select";

export default function PollEditor({ screen = {}, onChange = () => { } }) {
    const local = screen;
    const opts = Array.isArray(local.options) ? local.options : [];
    const properties = local.properties || { points: 0, timeLimit: 0, multiple: false, anonymous: false, style: "default" };
    const hasCustomBorderColor = !!(local.borderColor || properties.borderColor);

    const update = (patch) => onChange({ ...local, ...patch });
    const updateProps = (patch) => update({ properties: { ...(properties || {}), ...patch } });

    const addOption = () => update({ options: [...opts, { text: "New option", votes: 0 }] });
    const updateOption = (i, text) => {
        const copy = opts.map((o) => ({ ...o }));
        copy[i] = { ...copy[i], text };
        update({ options: copy });
    };
    const removeOption = (i) => {
        const copy = [...opts];
        copy.splice(i, 1);
        update({ options: copy });
    };

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    label="Poll question"
                    value={local.body || ""}
                    onChange={(e) => update({ body: e.target.value })}
                    rows={3}
                    placeholder="Write the poll question..."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3 mb-1">
                <div className={`lg:col-span-2 rounded-xl p-4 bg-white shadow-sm ${hasCustomBorderColor ? "" : "border-neutral-300"}`}>
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Options</div>
                        <Button variant="light" onClick={addOption} className="text-sm">
                            Add option
                        </Button>
                    </div>

                    <div className="space-y-2 mt-3">
                        {opts.length === 0 && <div className="text-sm text-slate-500">No options yet — add one.</div>}

                        {opts.map((o, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-md hover:shadow-sm">
                                <div className="flex-1">
                                    <Input
                                        value={o.text}
                                        onChange={(e) => updateOption(i, e.target.value)}
                                        placeholder={`Option ${i + 1}`}
                                        inputClass="py-2"
                                    />
                                </div>

                                <div>
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

                <div className={`rounded-xl p-4 bg-white shadow-sm space-y-3 ${hasCustomBorderColor ? "" : "border-neutral-300"}`}>

                    <div className="mb-1">
                        <label className="block text-sm font-medium text-[#0b1220] mb-1">Points</label>
                        <Input
                            type="number"
                            value={properties.points ?? 0}
                            onChange={(e) => updateProps({ points: Number(e.target.value) })}
                            inputClass="py-2"
                        />
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium text-[#0b1220] mb-1">Time limit (seconds)</label>
                        <Input
                            type="number"
                            value={properties.timeLimit ?? ""}
                            onChange={(e) => updateProps({ timeLimit: Number(e.target.value) })}
                            inputClass="py-2"
                        />
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium text-[#0b1220] mb-1">Allow multiple votes</label>
                        <div className="mt-3 mb-1">
                            <Button
                                variant={properties.multiple ? "primary" : "light"}
                                onClick={() => updateProps({ multiple: !properties.multiple })}
                                className="w-full"
                            >
                                {properties.multiple ? "Allow" : "Don't Allow"}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium text-[#0b1220] mb-1">Anonymous votes</label>
                        <div className="mt-3 mb-1">
                            <Button
                                variant={properties.anonymous ? "primary" : "light"}
                                onClick={() => updateProps({ anonymous: !properties.anonymous })}
                                className="w-full"
                            >
                                {properties.anonymous ? "Disable" : "Enable"}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-3 mb-1">
                        <label className="block text-sm font-medium text-[#0b1220] mb-4">Visual style</label>
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
