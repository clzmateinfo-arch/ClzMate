import Textarea from "@/shared/components/ui/Textarea";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

export default function ShortAnswerEditor({ screen = {}, onChange = () => { } }) {
    const local = screen;
    const properties = local.properties || { points: 1, timeLimit: 0 };

    const update = (patch) => onChange({ ...local, ...patch });

    return (
        <div className="space-y-6">
            <div>
                <Textarea
                    label="Prompt"
                    value={local.body || ""}
                    onChange={(e) => update({ body: e.target.value })}
                    rows={3}
                    placeholder="Write the prompt or question..."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-xl border-neutral-300 p-4 bg-white shadow-sm">
                    <div className="text-sm font-semibold mb-2">Response settings</div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-[#0b1220] mb-1">Placeholder</label>
                            <Input
                                value={local.placeholder || ""}
                                onChange={(e) => update({ placeholder: e.target.value })}
                                placeholder="E.g. Type your answer here..."
                                inputClass="py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#0b1220] mb-1 mt-3">Allow multiline</label>
                            <div className="mt-1">
                                <Button
                                    variant={local.allowMultiline ? "primary" : "light"}
                                    onClick={() => update({ allowMultiline: !local.allowMultiline })}
                                >
                                    {local.allowMultiline ? "Enabled" : "Enable"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border-neutral-300 p-4 bg-white shadow-sm">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
