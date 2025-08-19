import Template from "@/features/auth/ui/Template";
import signupImg from "@/shared/assets/images/signup.png";

function Signup() {
  return (
    <Template
      title="Join the millions learning to code with ClzMate for free"
      description1="Build skills for today, tomorrow, and beyond."
      description2="Education to future-proof your career."
      image={signupImg}
      formType="signup"
    />
  );
}

export default Signup;
