import loginImg from "@/shared/assets/images/logo/logo.png";
import Template from "@/features/auth/ui/Template";

function Login() {
  return (
    <Template
      title="Welcome Back"
      description1="Build skills for today, tomorrow, and beyond."
      description2="Education to future-proof your career."
      image={loginImg}
      formType="login"
    />
  );
}

export default Login;
