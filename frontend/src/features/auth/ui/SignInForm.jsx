import { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@/entities/auth/model/authAPI";
import fbLogo from "@/shared/assets/images/social_media/facebook-logo.png";
import googleLogo from "@/shared/assets/images/social_media/google-logo.png";

export default function SignInForm() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(login(email, password, navigate));
    };

    const inputCls =
        "mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]";

    return (
        <>
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Facebook signup */}
                <a
                    href="/app/auth/facebook?state=phoenix"
                    className="flex items-center justify-center gap-2 rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition border rounded-md border border-[#E9EFF5]"
                    aria-label="Sign up with Facebook"
                    style={{
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(16,24,40,0.04)",
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
                    className="flex items-center justify-center gap-2 rounded-md py-3 px-4 sm:flex-1 hover:shadow-sm transition border rounded-md border border-[#E9EFF5]"
                    aria-label="Sign up with Google"
                    style={{
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.90), inset 0 -1px 0 rgba(16,24,40,0.04)",
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

            {/* divider */}
            <div className="relative my-2 mt-5 mb-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#E9EFF5]" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-400 font-medium">or</span>
                </div>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <label className="block text-sm font-medium text-navy">
                    Email Address
                    <input
                        autoCapitalize="off"
                        autoCorrect="off"
                        autoFocus
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={"mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"}
                        placeholder="you@example.com"
                    />
                </label>

                <div>
                    <label className="block text-sm font-medium text-navy">
                        Password
                        <div className="relative mt-2 mb-5">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={"mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)] pr-10"}
                                aria-label="Password"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                            </button>
                        </div>
                    </label>

                    <a
                        href="/forgot-password"
                        className="text-violet-600 hover:text-violet-700 text-sm transition-colors inline-block mt-2 mb-2"
                    >
                        Forgotten password?
                    </a>
                </div>

                <button
                    type="submit"
                    className="btn-purple w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                >
                    Sign In
                </button>

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

                <a href="/signup" className="btn btn-link w-full block text-center text-sm text-violet-600 mt-10">
                    Need an Account?
                </a>
            </form>
        </>
    );
}
