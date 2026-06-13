import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { useSelector } from "react-redux";
import Input from "@/shared/components/ui/Input";

export default function ChipInput({ label, name, placeholder, register, errors, setValue }) {
  const { editCourse, course } = useSelector((state) => state.course);
  const [chips, setChips] = useState([]);

  useEffect(() => {
    if (editCourse && course?.tag) setChips(Array.isArray(course.tag) ? course.tag : []);
    register(name, { required: true, validate: (v) => Array.isArray(v) && v.length > 0 }, chips);
  }, [editCourse, course?.tag, name]);

  useEffect(() => setValue(name, chips), [chips, name, setValue]);

  const addChipsFromString = (str, clearInputCb) => {
    if (!str) {
      if (typeof clearInputCb === "function") clearInputCb();
      return;
    }
    const parts = str
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      if (typeof clearInputCb === "function") clearInputCb();
      return;
    }

    setChips((prev) => {
      const toAdd = parts.filter((p) => !prev.includes(p));
      if (toAdd.length === 0) return prev;
      return [...prev, ...toAdd];
    });

    if (typeof clearInputCb === "function") clearInputCb();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = e.target.value;
      addChipsFromString(value, () => {
        e.target.value = "";
      });
    }
  };

  const handlePaste = (e) => {
    const pasteText = e.clipboardData?.getData("text");
    if (!pasteText) return;
    if (pasteText.includes(",")) {
      e.preventDefault();
      addChipsFromString(pasteText, () => {
        const input = e.target;
        if (input) input.value = "";
      });
    }
  };

  const handleBlur = (e) => {
    const value = e.target.value;
    if (value && value.includes(",")) {
      addChipsFromString(value, () => {
        e.target.value = "";
      });
    } else {
      if (value?.trim()) {
        addChipsFromString(value, () => { e.target.value = ""; });
      }
    }
  };

  const handleDeleteChip = (chipIndex) => {
    setChips((p) => p.filter((_, index) => index !== chipIndex));
  };

  return (
    <div className="flex flex-col space-y-2 mt-3">
      <label className="block text-sm font-semibold text-[#0b1220]">
        {label} <sup className="text-pink-200">*</sup>
      </label>

      <div className="flex flex-wrap gap-2">
        {chips?.map((chip, index) => (
          <div
            key={index}
            className="m-1 flex items-center rounded-full bg-purple-100 px-2 py-1 text-sm text-purple-900"
          >
            {chip}
            <button type="button" className="ml-2 focus:outline-none" onClick={() => handleDeleteChip(index)}>
              <MdClose className="text-sm" />
            </button>
          </div>
        ))}

        <Input
          id={name}
          name={name}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          inputClass="min-w-[160px]"
        />
      </div>
      {errors[name] && <span className="mt-2 text-sm text-red-600">{label} is required</span>}
    </div>
  );
}
