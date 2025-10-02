// frontend/src/features/settings/ui/EditProfile.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { updateProfile, fetchUserDetailsApi } from "@/entities/settings/model/SettingsAPI";
import { setUser } from "@/entities/user/model/userSlice";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import FieldsetRadio from "@/shared/components/ui/FieldsetRadio";
import PhoneInput from "@/shared/components/ui/PhoneInput";
import Textarea from "@/shared/components/ui/Textarea";

const genders = ["Male", "Female", "Non-Binary", "Prefer not to say", "Other"];

export default function EditProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector((s) => s.user || {});
  const { token } = useSelector((s) => s.auth || {});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    contactNumber: "",
    about: "",
    protectMe: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && token) {
      (async () => {
        try {
          const data = await fetchUserDetailsApi(token);
          if (data) {
            const userImage =
              data?.image ||
              `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
                `${data.firstName || ""} ${data.lastName || ""}`.trim()
              )}`;
            const payload = { ...data, image: userImage };
            dispatch(setUser(payload));
            localStorage.setItem("user", JSON.stringify(payload));

            // <- FIX: read protectMe from payload.additionalDetails (not from `user`)
            setForm({
              firstName: payload.firstName || "",
              lastName: payload.lastName || "",
              dateOfBirth: payload?.additionalDetails?.dateOfBirth || "",
              gender: payload?.additionalDetails?.gender || "",
              contactNumber: payload?.additionalDetails?.contactNumber || "",
              about: payload?.additionalDetails?.about || "",
              protectMe: !!(payload?.additionalDetails?.protectMe),
            });
          }
        } catch (err) {
          console.warn("Could not auto-fetch user details.", err);
        }
      })();
    }
  }, [user, token, dispatch]);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        dateOfBirth: user?.additionalDetails?.dateOfBirth || "",
        gender: user?.additionalDetails?.gender || "",
        contactNumber: user?.additionalDetails?.contactNumber || "",
        about: user?.additionalDetails?.about || "",
        // <- FIX: coerce to boolean
        protectMe: !!(user?.additionalDetails?.protectMe),
      });
    }
  }, [user, location.pathname]);

  const handleChange = (field) => (e) => {
    const value = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.firstName?.trim()) err.firstName = "Please enter your first name.";
    if (!form.lastName?.trim()) err.lastName = "Please enter your last name.";
    if (!form.dateOfBirth) err.dateOfBirth = "Please enter your Date of Birth.";
    if (!form.gender) err.gender = "Please select your gender.";
    if (!form.contactNumber?.toString().trim()) err.contactNumber = "Please enter your Contact Number.";
    if (!form.about?.trim()) err.about = "Please enter your About.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submitProfileForm = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      additionalDetails: {
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        contactNumber: form.contactNumber,
        about: form.about,
        protectMe: !!form.protectMe,
      },
    };

    try {
      setSubmitting(true);
      await dispatch(updateProfile(token, payload));
    } catch (err) {
      console.error("Update profile failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 mb-3 mt-3 sm:p-8 text-black">
      <form onSubmit={submitProfileForm} className="space-y-8 text-black">
        <h2 className="text-lg font-semibold mb-5">Profile Information</h2>

        <div className="flex flex-col gap-2 w-full ml-1">
          <Input
            label="First Name"
            id="firstName"
            name="firstName"
            type="text"
            placeholder="Enter first name"
            inputClass="mt-2 mb-5 p-2.5"
            value={form.firstName}
            onChange={handleChange("firstName")}
            required
            error={errors.firstName}
          />
          {errors.firstName && <span className="text-sm text-red-600">{errors.firstName}</span>}
        </div>

        <div className="flex flex-col gap-2 w-full ml-1">
          <Input
            label="Last Name"
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Enter last name"
            inputClass="mt-2 mb-5 p-2.5"
            value={form.lastName}
            onChange={handleChange("lastName")}
            required
            error={errors.lastName}
          />
          {errors.lastName && <span className="text-sm text-red-600">{errors.lastName}</span>}
        </div>

        <div className="flex flex-col gap-2 w-full ml-1">
          <Input
            label="Date of Birth"
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            inputClass="mt-2 mb-5 p-2.5"
            value={form.dateOfBirth}
            onChange={handleChange("dateOfBirth")}
            max={today}
            required
            error={errors.dateOfBirth}
          />
          {errors.dateOfBirth && <span className="text-sm text-red-600">{errors.dateOfBirth}</span>}
        </div>

        <div className="mt-2 mb-5">
          <div className="overflow-x-auto">
            <div className="inline-flex items-center gap-4 ml-1">
              <FieldsetRadio
                name="gender"
                label="Gender"
                options={genders.map((g) => ({ value: g, label: g }))}
                value={form.gender}
                onChange={(val) => handleChange("gender")(val)}
                required
                error={errors.gender}
                orientation="row"
              />
            </div>
          </div>
          {errors.gender && <div className="text-sm text-red-600 mt-1 ml-1">{errors.gender}</div>}
        </div>

        <div className="flex flex-col gap-2 w-full ml-1">
          <PhoneInput label="Contact Number" value={form.contactNumber} onChange={handleChange("contactNumber")} error={errors.contactNumber} />
          {errors.contactNumber && <span className="text-sm text-red-600">{errors.contactNumber}</span>}
        </div>

        <div className="flex flex-col gap-2 w-full ml-1 mt-5">
          <Textarea
            label="About"
            name="about"
            value={form.about}
            onChange={handleChange("about")}
            placeholder="Write a detailed message…"
            autosize
            maxLength={800}
            error={errors.about}
          />
          {errors.about && <span className="text-sm text-red-600">{errors.about}</span>}
        </div>

        <div className="flex items-center gap-3 mt-4 ml-1">
          <input
            id="protectMe"
            type="checkbox"
            checked={!!form.protectMe}
            onChange={handleChange("protectMe")}
            className="w-4 h-4"
          />
          <label htmlFor="protectMe" className="text-sm">
            Protect my profile (only username and account type will be visible publicly)
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <Button type="submit" className="min-w-[220px] text-sm" disabled={submitting} animated>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
