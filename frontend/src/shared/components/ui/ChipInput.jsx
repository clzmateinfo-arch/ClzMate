/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import Input from "@/shared/components/ui/Input";

export default function ChipInput({ label, name, placeholder, register, errors, setValue }) {
  const { editCourse, course } = useSelector((state) => state.course);
  const [chips, setChips] = useState([]);

  useEffect(() => {
    if (editCourse && course?.tag) setChips(Array.isArray(course.tag) ? course.tag : []);
    register(name, { required: true, validate: (v) => Array.isArray(v) && v.length > 0 }, chips);
  }, [useLocation().pathname]);

  useEffect(() => setValue(name, chips), [chips, name, setValue]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const chipValue = e.target.value.trim();
      if (chipValue && !chips.includes(chipValue)) {
        setChips((p) => [...p, chipValue]);
        e.target.value = "";
      }
    }
  };

  const handleDeleteChip = (chipIndex) => {
    setChips((p) => p.filter((_, index) => index !== chipIndex));
  };

  return (
    <div className="flex flex-col space-y-2 mt-3">
      <label className="block text-sm font-semibold text-[#0b1220]">{label} <sup className="text-pink-200">*</sup></label>

      <div className="flex flex-wrap gap-2">
        {chips?.map((chip, index) => (
          <div key={index} className="m-1 flex items-center rounded-full bg-yellow-400 px-2 py-1 text-sm text-black">
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
          inputClass="min-w-[160px]"
        />
      </div>
      {errors[name] && <span className="mt-2 text-sm text-red-600">{label} is required</span>}
    </div>
  );
}
