import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register } from "@/entities/auth/model/authAPI";
import fbLogo from "@/shared/assets/images/social_media/facebook-logo.png";
import googleLogo from "@/shared/assets/images/social_media/google-logo.png";

export default function SignUpForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ role: "", password: "" });

  const resetErrors = () => setErrors({ role: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    resetErrors();

    let hasError = false;
    if (!role) {
      setErrors((prev) => ({ ...prev, role: "Please select a role." }));
      hasError = true;
    }
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, password: "Passwords do not match." }));
      hasError = true;
    }
    if (hasError) return;

    dispatch(register({ email, password, preferredName, role }, navigate));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Facebook signup */}
        <a
          href="/app/auth/facebook?state=phoenix"
          className="flex items-center justify-center gap-2 rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition border border-[#E9EFF5]"
          aria-label="Sign up with Facebook"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(16,24,40,0.04)",
          }}
        >
          <img
            src={fbLogo}
            alt="Facebook logo"
            className="w-5 h-5 object-contain"
            width="20"
            height="20"
            role="img"
            loading="eager"
          />
          <span>Sign up with Facebook</span>
        </a>

        {/* Google signup */}
        <a
          href="/app/auth/google?state=phoenix"
          className="flex items-center justify-center gap-2 rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition border border-[#E9EFF5]"
          aria-label="Sign up with Google"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(16,24,40,0.04)",
          }}
        >
          <img
            src={googleLogo}
            alt="Google logo"
            className="w-5 h-5 object-contain"
            width="20"
            height="20"
            role="img"
            loading="eager"
          />
          <span>Sign up with Google</span>
        </a>
      </div>

      {/* Divider */}
      <div className="relative my-2 mt-5 mb-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#E9EFF5]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400 font-medium">or</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>

        <fieldset className="mb-4">
          <legend className="text-sm font-medium text-navy mb-2">I am a</legend>

          <div role="radiogroup" aria-required="true" aria-label="Select role" className="flex gap-3">
            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-3xl cursor-pointer border hover:bg-violet-100 ${role === "student" ? "border-violet-500 bg-violet-50" : "border-gray-200"
                }`}
            >
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={(e) => setRole(e.target.value)}
                className="sr-only"
                aria-checked={role === "student"}
              />
              <span className="text-sm">Student</span>
            </label>

            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-3xl cursor-pointer border hover:bg-violet-100 ${role === "instructor" ? "border-violet-500 bg-violet-50" : "border-gray-200"
                }`}
            >
              <input
                type="radio"
                name="role"
                value="instructor"
                checked={role === "instructor"}
                onChange={(e) => setRole(e.target.value)}
                className="sr-only"
                aria-checked={role === "instructor"}
              />
              <span className="text-sm">Instructor</span>
            </label>

            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-3xl cursor-pointer border hover:bg-violet-100 ${role === "parent" ? "border-violet-500 bg-violet-50" : "border-gray-200"
                }`}
            >
              <input
                type="radio"
                name="role"
                value="parent"
                checked={role === "parent"}
                onChange={(e) => setRole(e.target.value)}
                className="sr-only"
                aria-checked={role === "parent"}
              />
              <span className="text-sm">Parent</span>
            </label>

            <label
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-3xl cursor-pointer border hover:bg-violet-100 ${role === "guest" ? "border-violet-500 bg-violet-50" : "border-gray-200"
                }`}
            >
              <input
                type="radio"
                name="role"
                value="guest"
                checked={role === "guest"}
                onChange={(e) => setRole(e.target.value)}
                className="sr-only"
                aria-checked={role === "guest"}
              />
              <span className="text-sm">Guest</span>
            </label>
          </div>

          {errors.role && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {errors.role}
            </p>
          )}
        </fieldset>
        {/* Preferred Name */}
        <label className="block text-sm font-medium text-navy">
          Preferred Name
          <input
            autoCapitalize="off"
            autoCorrect="off"
            required
            type="text"
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
            placeholder="Sandeepa"
            aria-label="Preferred name"
          />
        </label>

        {/* Email */}
        <label className="block text-sm font-medium text-navy">
          Email Address
          <input
            autoCapitalize="off"
            autoCorrect="off"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
            placeholder="you@example.com"
            aria-label="Email address"
          />
        </label>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-navy">
            Password
            <div className="relative mt-2 mb-5">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>
          </label>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-navy">
            Confirm Password
            <div className="relative mt-2 mb-5">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
                aria-label="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-purple w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
        >
          Create Account
        </button>

        {/* Terms + Redirect */}
        <div className="text-center text-sm mt-2">
          <span>Creating an account means you agree to our </span>
          <a
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            href="/legal/terms-of-service/"
            target="_blank"
            rel="noreferrer"
          >
            terms
          </a>
          <span> and </span>
          <a
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            href="/legal/privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            privacy
          </a>
          <span> policy </span>
        </div>

        <a href="/login" className="block text-center text-sm text-violet-600 mt-2">
          Already have an account?
        </a>
      </form>
    </>
  );
}
