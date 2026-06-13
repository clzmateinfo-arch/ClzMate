 
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RiDeleteBin6Line } from "react-icons/ri";
import Input from "@/shared/components/ui/Input";
import Button from "../../../../shared/components/ui/Button";

export default function RequirementsField({ name, label, register, setValue, errors }) {
  const { editCourse, course } = useSelector((state) => state.course);
  const [requirement, setRequirement] = useState("");
  const [requirementsList, setRequirementsList] = useState([]);

  useEffect(() => {
    if (editCourse && course?.instructions) setRequirementsList(Array.isArray(course.instructions) ? course.instructions : []);
    register(name, { required: true, validate: (v) => Array.isArray(v) && v.length > 0 }, requirementsList);
  }, []);

  useEffect(() => setValue(name, requirementsList), [requirementsList, name, setValue]);

  const handleAddRequirement = () => {
    if (requirement && !requirementsList.includes(requirement)) {
      setRequirementsList((p) => [...p, requirement]);
      setRequirement("");
    }
  };

  const handleRemoveRequirement = (index) => {
    setRequirementsList((p) => p.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="block text-sm font-semibold text-[#0b1220]">{label} <sup className="text-pink-200">*</sup></label>

      <div className="flex items-center gap-3">
        <Input value={requirement} onChange={(e) => setRequirement(e.target.value)} className="flex-1" placeholder="Add requirement" />
        <div className="mt-2">
          <Button
            type="button"
            classes="text-m ml-2" o
            onClick={handleAddRequirement}
            animated={false}
          >
            Add
          </Button>
        </div>
      </div>

      {requirementsList.length > 0 && (
        <ul className="mt-1 list-disc ml-5 space-y-2">
          {requirementsList.map((req, idx) => (
            <li key={idx} className="flex items-center justify-start text-sm text-richblack-900">
              <Button
                type="button"
                className="mt-2"
                onClick={() => handleRemoveRequirement(idx)}
                animated={false}
              >
                <RiDeleteBin6Line className="text-red-500 text-sm hover:scale-110 duration-150" />
              </Button>
              <span className="ml-4 mt-2">{req}</span>
            </li>
          ))}
        </ul>
      )}

      {errors[name] && <span className="mt-2 text-sm text-red-600">{label} is required</span>}
    </div>
  );
}
