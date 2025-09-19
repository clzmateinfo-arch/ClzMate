import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@/entities/auth/model/authAPI";
import fbLogo from "@/shared/assets/images/social_media/facebook-logo.png";
import googleLogo from "@/shared/assets/images/social_media/google-logo.png";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import SocialAuthButton from "@/shared/components/helpers/SocialAuthButton";

export default function SignInForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(email, password, navigate));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <SocialAuthButton
          href="/app/auth/facebook?state=phoenix"
          logo={fbLogo}
          label="Continue with Facebook"
          theme="facebook"
          className="justify-center"
          ariaLabel="Continue with Facebook"
        />

        <SocialAuthButton
          href="/app/auth/google?state=phoenix"
          logo={googleLogo}
          label="Continue with Google"
          theme="google"
          className="justify-center"
          ariaLabel="Continue with Google"
        />
      </div>

      <div className="relative my-2 mt-5 mb-5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#E9EFF5]" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-400 font-medium">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
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

          <a href="/forgot-password" className="text-violet-600 hover:text-violet-700 text-sm transition-colors inline-block mt-0 mb-5">
            Forgotten password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full"
          style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
          animated={true}
        >
          Sign In
        </Button>

        <div className="text-center text-sm mt-5">
          <span>By signing in you agree to our </span>
          <a
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            href="/legal/terms-of-service/"
            target="_blank"
            rel="noreferrer"
          >
            terms of service
          </a>
          <span> and </span>
          <a
            className="text-navy underline underline-offset-2 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
            href="/legal/privacy-policy/"
            target="_blank"
            rel="noreferrer"
          >
            privacy policy
          </a>
        </div>

        <a href="/signup" className="btn btn-link w-full block text-center text-sm text-violet-600 mt-2">
          Need an Account?
        </a>
      </form>
    </>
  );
}
