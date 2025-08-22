import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import OtpInput from "react-otp-input";
import { verifyOtp } from "@/entities/auth/model/authAPI";

export default function VerifyEmailForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { signupData } = useSelector((state) => state.auth);

    const [otp, setOtp] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        dispatch(verifyOtp(signupData?.email, otp, navigate));
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

                {/* Submit */}
                <button
                    type="submit"
                    disabled={otp.length < 6}
                    className="btn-purple w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors"
                    style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                >
                    Verify Email
                </button>
            </form>
        </>
    );
}
