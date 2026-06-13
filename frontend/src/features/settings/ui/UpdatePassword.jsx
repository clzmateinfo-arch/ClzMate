// UpdatePassword.jsx
import { useState } from "react";
import { useSelector } from "react-redux";

import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";

import { changePassword } from "@/entities/settings/model/SettingsAPI";

export default function UpdatePassword() {
  const { token } = useSelector((s) => s.auth);

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: undefined, form: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.oldPassword) err.oldPassword = "Please enter your current password.";
    if (!form.newPassword) err.newPassword = "Please enter a new password.";
    else if (form.newPassword.length < 8) err.newPassword = "Password must be at least 8 characters.";
    if (!form.confirmNewPassword) err.confirmNewPassword = "Please confirm your new password.";
    else if (form.newPassword !== form.confirmNewPassword) err.confirmNewPassword = "Passwords do not match.";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const submitPasswordForm = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
      confirmNewPassword: form.confirmNewPassword,
    };

    try {
      setSubmitting(true);
      if (typeof changePassword === "function" && changePassword.length) {
        await changePassword(token, payload);
      } else {
        await changePassword(token, payload);
      }
    } catch (err) {
      console.error("Change password failed", err);
      //setErrors((p) => ({ ...p, form: "Unable to change password. Please try again." }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-sm shadow-violet-950/10 p-6 mb-3 mt-3 sm:p-8 text-black">
      <form onSubmit={submitPasswordForm} className="space-y-6 text-black">
        <h2 className="text-lg font-semibold mb-5">Update Password</h2>

        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="relative flex flex-col gap-2 lg:w-1/3 md:w-1/2">
            <Input
              label="Current Password"
              id="oldPassword"
              name="oldPassword"
              type="password"
              value={form.oldPassword}
              onChange={handleChange("oldPassword")}
              placeholder="Enter your current password"
              required
              error={errors.oldPassword}
              showPasswordToggle={true}
              inputClass="mt-2 mb-5 p-2.5"
            />

            {errors.oldPassword && <span className="error-text">{errors.oldPassword}</span>}
          </div>
          <div className="relative flex flex-col gap-2 lg:w-1/3 md:w-1/2">
            <Input
              label="New Password"
              id="newPassword"
              name="newPassword"
              type="password"
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              placeholder="Enter your new password"
              required
              error={errors.newPassword}
              showPasswordToggle={true}
              inputClass="mt-2 mb-5 p-2.5"
            />

            {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
          </div>
          <div className="relative flex flex-col gap-2 lg:w-1/3 md:w-1/2">
            <Input
              label="Confirm New Password"
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              value={form.confirmNewPassword}
              onChange={handleChange("confirmNewPassword")}
              placeholder="Confirm your new password"
              required
              error={errors.confirmNewPassword}
              showPasswordToggle={true}
              inputClass="mt-2 mb-5 p-2.5"
            />

            {errors.confirmNewPassword && <span className="error-text">{errors.confirmNewPassword}</span>}
          </div>
        </div>

        {errors.form && <div className="text-sm text-red-500">{errors.form}</div>}

        <div className="flex justify-end gap-3 mt-5">
          <Button
            type="submit"
            className="min-w-[220px] text-sm"
            disabled={submitting}
            animated={true}
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
