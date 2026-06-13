
export default function CatalogSidebar({
    categories = [],
    selectedCategoryId,
    onChange = () => { },
    _visible = false,
    onClose = () => { },
}) {
    return (
        <aside className="bg-white text-black rounded-2xl p-4 shadow-sm border border-[#efe7ff]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Filters</h3>
                <button onClick={onClose} className="text-sm px-2 py-1 rounded-md bg-gray-100">
                    Close
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-medium mb-2">Category</h4>
                    <div className="flex flex-col gap-2 max-h-40 overflow-auto pr-2">
                        {categories.map((c) => (
                            <label key={c._id} className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="radio"
                                    name="catalog-category"
                                    checked={selectedCategoryId === c._id}
                                    onChange={() => onChange({ categoryId: c._id })}
                                    className="form-radio"
                                />
                                <span>{c.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-medium mb-2">Price</h4>
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="price" onChange={() => onChange({ price: "all" })} defaultChecked className="form-radio" />
                            <span>All</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="price" onChange={() => onChange({ price: "free" })} className="form-radio" />
                            <span>Free</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="price" onChange={() => onChange({ price: "paid" })} className="form-radio" />
                            <span>Paid</span>
                        </label>
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-medium mb-2">Level</h4>
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="level" onChange={() => onChange({ level: "all" })} defaultChecked className="form-radio" />
                            <span>All</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="level" onChange={() => onChange({ level: "beginner" })} className="form-radio" />
                            <span>Beginner</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="level" onChange={() => onChange({ level: "intermediate" })} className="form-radio" />
                            <span>Intermediate</span>
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input type="radio" name="level" onChange={() => onChange({ level: "advanced" })} className="form-radio" />
                            <span>Advanced</span>
                        </label>
                    </div>
                </div>
            </div>
        </aside>
    );
}
