import { setLoading, setToken, setSignupData } from "./authSlice";
import { resetCart } from "@/entities/cart/model/cartSlice";
import { setUser } from "@/entities/user/model/userSlice";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { endpoints } from "@/app/config/apis";
import { showToast } from "@/shared/components/feedback/CustomToast";

const {
  SENDOTP_API,
  VERIFYOTP_API,
  SIGNUP_API,
  LOGIN_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints;

function extractErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export function register(signupData, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {

      await dispatch(setSignupData(signupData));

      const response = await apiConnector(
        "POST",
        SIGNUP_API,
        { ...signupData },
        {},
        {}
      );

      if (!response.data.success) {
        showToast(`Ops! ${response.data.message}`, "error");
        throw new Error(response.data.message);
      } else {
        showToast(`Awesome, Welcome to the club ${signupData?.preferredName}`, "success");
        await dispatch(sendOtp(signupData.email, navigate));
      }

    } catch (error) {
      showToast(
        `Ops! ${extractErrorMessage(
          error
        )}`,
        "error"
      );
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function sendOtp(email, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector(
        "POST",
        SENDOTP_API,
        { email, checkUserPresent: true },
        {},
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      } else {
        showToast(
          `OTP sent successfully to email ${email}. Please check and confirm`,
          "success"
        );
        navigate("/verify-email");
      }

    } catch (error) {
      showToast(
        `Ops! ${extractErrorMessage(
          error
        )}`,
        "error"
      );
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function verifyOtp(email, otp, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector(
        "POST",
        VERIFYOTP_API,
        { email, otp },
        {},
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      showToast(`OTP verified successfully for ${email}`, "success");
      navigate("/login");
    } catch (error) {
      showToast(
        `Ops! ${extractErrorMessage(error)}`,
        "error"
      );
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function login(email, password, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector(
        "POST",
        LOGIN_API,
        { email, password },
        {},
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      showToast(`Hi!, Welcome back ${response.data.user.firstName}`, "success");
      dispatch(setToken(response?.data?.token));

      const userImage = response.data?.user?.image
        ? response.data.user.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.user.firstName} ${response.data.user.lastName}`;

      dispatch(setUser({ ...response.data.user, image: userImage }));
      localStorage.setItem("token", JSON.stringify(response.data?.token));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...response.data.user, image: userImage })
      );

      navigate("/dashboard");
    } catch (error) {
      showToast(`Ops! ${extractErrorMessage(error)}`, "error");
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function getPasswordResetToken(email, setEmailSent) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector(
        "POST",
        RESETPASSTOKEN_API,
        { email },
        {},
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      showToast(
        `Password reset instructions sent successfully to email ${email}. Please check`,
        "success"
      );
      setEmailSent(true);
    } catch (error) {
      showToast(`Ops! ${extractErrorMessage(error)}`, "error");
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector(
        "POST",
        RESETPASSWORD_API,
        { password, confirmPassword, token },
        {},
        {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      showToast(`Password reset successful`, "success");
      navigate("/login");
    } catch (error) {
      showToast(`Ops! ${extractErrorMessage(error)}`, "error");
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null));
    dispatch(setUser(null));
    dispatch(resetCart());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    showToast(`Successfully logged out`, "success");
  };
}
