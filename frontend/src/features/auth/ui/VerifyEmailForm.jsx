import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import OtpInput from "react-otp-input";
import { verifyOtp, sendOtp } from "@/entities/auth/model/authAPI";
import Button from "@/shared/components/ui/Button";

export default function VerifyEmailForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { signupData } = useSelector((state) => state.auth);

    const [otp, setOtp] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        dispatch(verifyOtp(signupData?.email, otp, navigate));
    };

    const resendOtp = () => {
        dispatch(sendOtp(signupData?.email, navigate));
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* OTP */}
                <div>
                    <label className="block text-sm font-medium text-navy">
                        <OtpInput
                            value={otp}
                            onChange={setOtp}
                            numInputs={6}
                            isInputNum={true}
                            shouldAutoFocus
                            renderInput={(props) => (
                                <input
                                    {...props}
                                    inputMode="numeric"
                                    pattern="\d*"
                                    className="mt-2 mb-5 p-2.5 block w-full rounded-md border border-[#E9EFF5] bg-white text-gray-900 transition duration-150 focus:border-[#996bec] focus:outline-none focus:[box-shadow:0_0_0_3px_rgba(153,107,236,0.12)]"
                                    aria-label="OTP digit"
                                    style={{ width: "100 %", textAlign: "center" }}
                                />
                            )}
                            containerStyle={{ width: "100%", display: "flex", justifyContent: "space-between", gap: "0 2px" }}
                        />
                    </label>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                    animated={true}
                >
                    Verify Email
                </Button>

                <div className="text-right text-sm mt-2">
                    <a
                        className="inline-flex items-center gap-1 text-violet-600 decoration-1 decoration-navy-300 hover:text-violet-600 transition-all"
                        target="_blank"
                        rel="noreferrer"
                        onClick={resendOtp}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            className="w-4 h-4"
                            fill="oklch(54.1% 0.281 293.009)"
                        >
                            <path d="M256 48c-68.38 0-129.9 31.06-170.8 80H48v80h128V80H125.4C157.2 52.57 204.6 32 256 32c114.9 0 208 93.13 208 208s-93.13 208-208 208c-78.19 0-146.5-43.43-182.4-108H48c37.14 83.09 120.5 140 208 140 132.5 0 240-107.5 240-240S388.5 48 256 48z" />
                        </svg>
                        Resend
                    </a>
                </div>

            </form>
        </>
    );
}
