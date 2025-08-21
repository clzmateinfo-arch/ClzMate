import { useState, useEffect } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "@/entities/auth/model/authAPI";

export default function UpdatePasswordForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useSelector((state) => state.auth);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({ confirmPassword: "", password: "" });

    const resetErrors = () => setErrors({ confirmPassword: "", password: "" });

    const handleSubmit = (e) => {
        e.preventDefault();
        resetErrors();

        let hasError = false;
        if (password !== confirmPassword) {
            setErrors((prev) => ({ ...prev, password: "Passwords do not match." }));
            hasError = true;
        }
        if (hasError) return;

        dispatch(resetPassword(password, confirmPassword, token, navigate));
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    Reset Password
                </button>
            </form>
        </>
    );
}
