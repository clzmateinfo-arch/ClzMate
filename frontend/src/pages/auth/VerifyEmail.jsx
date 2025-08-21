import React, { useEffect, useState } from "react";
import OtpInput from "react-otp-input";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { RxCountdownTimer } from "react-icons/rx";
import { useDispatch, useSelector } from "react-redux";
import { sendOtp, register } from "@/entities/auth/model/authAPI";
import Loading from "@/shared/components/navigation/Loading";
import backgroundImg from "@/shared/assets/images/auth/sign-in-right-banner.png";

export default function VerifyEmail() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { signupData, loading } = useSelector((s) => s.auth || {});
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!signupData) {
      // navigate("/signup");
    }
  }, []);

  const handleVerifyAndSignup = (e) => {
    e.preventDefault();
    if (!signupData) return;
    const { accountType, firstName, lastName, email, password, confirmPassword } = signupData;
    dispatch(
      register(
        accountType,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        otp,
        navigate
      )
    );
  };

  const handleResend = () => {
    if (!signupData?.email) return;
    setOtp("");
    dispatch(sendOtp(signupData.email, navigate));
  };

  const inputCls =
    "w-[56px] lg:w-[56px] h-[56px] lg:h-[64px] rounded-md border border-[#E9EFF5] bg-white text-gray-900 text-2xl font-medium " +
    "focus:outline-none focus:border-[#996bec] focus:[box-shadow:0_0_0_6px_rgba(153,107,236,0.12)]";

  return (
    <main className="w-full h-full min-h-screen grid lg:grid-cols-span-auto text-gray-700 lg:grid-cols-[1fr_32rem] bg-transparent">
      <section className="h-full flex flex-col justify-center items-center p-6 lg:p-10">

        <div className="w-full max-w-md mt-40 pb-16 mb-auto">
          <h1 className="text-2xl md:text-3xl mb-8 text-navy font-semibold">Verify Email</h1>

          <p className="block text-base mb-7 text-gray-500">
            A verification code has been sent to your email. Enter the code below.
          </p>

          {loading ? (
            <Loading />
          ) : (
            <form onSubmit={handleVerifyAndSignup} className="space-y-1" noValidate>
              <div className="flex justify-between gap-1">
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
                      className={inputCls}
                      aria-label="OTP digit"
                      style={{ width: "100 %", textAlign: "center" }}
                    />
                  )}
                  containerStyle={{ width: "100%", display: "flex", justifyContent: "space-between", gap: "0 2px" }}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#ba7bf0] via-[#996bec] to-[#5046e4] text-white py-3 rounded-md font-medium mt-5"
                style={{ boxShadow: "0 6px 18px rgba(80,70,228,0.16)" }}
                disabled={otp.length < 6}
                aria-disabled={otp.length < 6}
              >
                Verify Email
              </button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Link to="/dashboard/settings">
              <p className="text-navy text-sm flex items-center gap-x-2">
                <BiArrowBack />
                Back
              </p>
            </Link>

            <button
              type="button"
              onClick={handleResend}
              disabled={!signupData?.email}
              className="inline-flex items-center gap-x-2 text-sm text-violet-600 hover:text-violet-700 transition-colors"
            >
              <RxCountdownTimer />
              Resend it
            </button>
          </div>
        </div>
      </section>

      <aside className="relative hidden lg:block lg:w-[28rem] xl:w-[32rem] h-full p-16">
        {backgroundImg && (
          <img src={backgroundImg} alt="hero" className="absolute inset-0 max-w-none w-full h-full object-cover opacity-25" />
        )}

        <blockquote className="mt-10 relative z-20 text-2xl font-heading text-purple-900">
          <p className="leading-tight">An investment in knowledge</p>
          <p className="leading-tight">pays the best interest</p>
          <cite className="block not-italic text-xl mt-6">
            <span className="opacity-40">—</span> Benjamin Franklin
          </cite>
        </blockquote>

        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" aria-hidden />
      </aside>
    </main>
  );
}
