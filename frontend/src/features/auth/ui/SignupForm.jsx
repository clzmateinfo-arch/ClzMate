import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/entities/auth/model/authAPI";
import fbLogo from "@/shared/assets/images/social_media/facebook-logo.png";
import googleLogo from "@/shared/assets/images/social_media/google-logo.png";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import SocialAuthButton from "@/shared/components/helpers/SocialAuthButton";
import FieldsetRadio from "@/shared/components/ui/FieldsetRadio";
import { ACCOUNT_TYPE_PUBLIC } from "@/utils/constants";

export default function SignupForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [preferredName, setPreferredName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountType, setRole] = useState(ACCOUNT_TYPE_PUBLIC.STUDENT);
  const [errors, setErrors] = useState({});

  const resetErrors = () => setErrors({ accountType: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    resetErrors();

    let hasError = false;
    if (!accountType) {
      setErrors((prev) => ({ ...prev, accountType: "Please select a accountType" }));
      hasError = true;
    }
    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, password: "Passwords do not match" }));
      hasError = true;
    }
    if (hasError) return;

    dispatch(
      register(
        { preferredName, firstName: "", lastName: "", email, password, confirmPassword, contactNumber: "", accountType, otp: 0 },
        navigate
      )
    );
  };

  const roleOptions = Object.values(ACCOUNT_TYPE_PUBLIC || {});

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link to="/app/auth/facebook?state=phoenix" aria-label="Continue with Facebook" className="w-full">
          <SocialAuthButton
            logo={fbLogo}
            label="Continue with Facebook"
            theme="facebook"
            className="justify-center"
            ariaLabel="Continue with Facebook"
          />
        </Link>

        <Link to="/app/auth/google?state=phoenix" aria-label="Continue with Google" className="w-full">
          <SocialAuthButton
            logo={googleLogo}
            label="Continue with Google"
            theme="google"
            className="justify-center"
            ariaLabel="Continue with Google"
          />
        </Link>
      </div>

      <div className="relative my-2 mt-5 mb-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-[#E9EFF5]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400 font-medium">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4" noValidate>
        <FieldsetRadio
          name="accountType"
          label="I am a"
          options={roleOptions.map((v) => ({ value: v, label: v }))}
          value={accountType}
          onChange={(val) => setRole(val)}
          required
          error={errors.accountType}
          helpText="Choose the role that best describes you"
          orientation="row"
        />

        <Input
          label="Preferred Name"
          id="preferredName"
          name="preferredName"
          type="text"
          value={preferredName}
          onChange={(e) => setPreferredName(e.target.value)}
          placeholder="Sandeepa"
          autoFocus
          required
          error={errors?.preferredName}
          inputClass="mt-2 mb-5 p-2.5"
        />

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          error={errors.email}
          inputClass="mt-2 mb-5 p-2.5"
        />

        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            error={errors.password}
            showPasswordToggle={true}
            inputClass="mt-2 mb-5 p-2.5"
          />
        </div>

        <div>
          <Input
            label="Confirm Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            error={errors.confirmPassword}
            showPasswordToggle={true}
            inputClass="mt-2 mb-5 p-2.5"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
          animated={true}
        >
          Create Account
        </Button>

        <div className="text-center text-sm mt-2">
          <span>Creating an account means you agree to our </span>
          <Link
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            to="/legal/terms-of-service/"
            target="_blank"
            rel="noreferrer"
          >
            terms
          </Link>
          <span> and </span>
          <Link
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            to="/legal/privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            privacy policy
          </Link>
        </div>

        <Link to="/login" className="block text-center text-sm text-violet-600 mt-2">
          Already have an account?
        </Link>
      </form>
    </>
  );
}
