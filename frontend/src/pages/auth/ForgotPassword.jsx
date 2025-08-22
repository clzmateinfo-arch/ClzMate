
import { Link } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import AuthContent from "@/features/auth/ui/AuthContent";
import AsidePanel from "@/features/auth/ui/AsidePanel";
import ForgotPasswordForm from "@/features/auth/ui/ForgotPasswordForm";
import backgroundImg from "@/shared/assets/images/auth/sign-up-right-banner.png";

export default function ForgotPassword() {
  const asideQuote = {
    lines: ["The more that you read, the more things you will know", "The more that you learn, the more places you'll go"],
    cite: " Dr. Seuss",
  };

  return (
    <main className="w-full min-h-screen grid lg:grid-cols-[1fr_32rem] text-gray-700">
      <AuthContent title="Reset Your Password">
        <ForgotPasswordForm />
        <div className="mt-6">
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-violet-500 hover:text-violet-700 transition-colors">
            <BiArrowBack className="mr-2" />
            Return
          </Link>
        </div>
      </AuthContent>

      <AsidePanel
        image={backgroundImg}
        lines={asideQuote.lines}
        cite={asideQuote.cite}
        overlay={true}
      />
    </main>
  );
}