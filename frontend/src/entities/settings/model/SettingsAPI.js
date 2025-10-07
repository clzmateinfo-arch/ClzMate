// frontend/src/entities/user/model/settingsAPI.js
import { toast } from "react-hot-toast";
import { setUser } from "@/entities/user/model/userSlice";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { settingsEndpoints, profileEndpoints } from "@/app/config/apis";
import { logout } from "@/entities/auth/model/authAPI";

const {
  UPDATE_DISPLAY_PICTURE_API,
  UPDATE_PROFILE_API,
  CHANGE_PASSWORD_API,
  DELETE_PROFILE_API,
} = settingsEndpoints;

const {
  GET_USER_DETAILS_API,
} = profileEndpoints;

export const fetchUserDetailsApi = async (token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resp = await apiConnector("GET", GET_USER_DETAILS_API, null, headers);
    if (!resp?.data?.success) throw new Error(resp?.data?.message || "Failed to get user details");
    return resp.data.data;
  } catch (err) {
    console.error("fetchUserDetailsApi error", err);
    toast.error(err?.message || "Failed to fetch profile");
    throw err;
  }
};

export function fetchAndSetUserDetails(token) {
  return async (dispatch) => {
    try {
      const data = await fetchUserDetailsApi(token);
      if (data) {
        const userImage =
          data?.image ||
          `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
            `${data.firstName || ""} ${data.lastName || ""}`.trim()
          )}`;
        const payloadToSet = { ...data, image: userImage };
        dispatch(setUser(payloadToSet));
        localStorage.setItem("user", JSON.stringify(payloadToSet));
        return payloadToSet;
      }
      return null;
    } catch (err) {
      console.error("fetchAndSetUserDetails error", err);
      return null;
    }
  };
}

export function updateUserProfileImage(token, formData) {
  return async (dispatch) => {
    const toastId = toast.loading("Updating profile image...");
    try {
      const response = await apiConnector("PUT", UPDATE_DISPLAY_PICTURE_API, formData, {
        Authorization: `Bearer ${token}`,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to update profile image");
      }

      const updated = response.data.data || response.data.updatedUserDetails || response.data.updatedUser;
      if (updated) {
        dispatch(setUser(updated));
        localStorage.setItem("user", JSON.stringify(updated));
      }

      toast.success("Display Picture Updated Successfully");
      return updated;
    } catch (error) {
      console.error("UPDATE_DISPLAY_PICTURE_API ERROR", error);
      toast.error(error?.message || "Could Not Update Profile Picture");
      return null;
    } finally {
      toast.dismiss(toastId);
    }
  };
}

export function updateProfile(token, payload) {
  return async (dispatch) => {
    const toastId = toast.loading("Updating profile...");
    try {
      const response = await apiConnector("PUT", UPDATE_PROFILE_API, payload, {
        Authorization: `Bearer ${token}`,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Failed to update profile");
      }

      const updatedFromResponse = response.data.updatedUserDetails || response.data.data || response.data.updatedUser;

      let finalUser = updatedFromResponse;
      if (!finalUser) {
        try {
          const fetchRes = await apiConnector("GET", GET_USER_DETAILS_API, null, {
            Authorization: `Bearer ${token}`,
          });
          if (fetchRes?.data?.success) {
            finalUser = fetchRes.data.data;
          }
        } catch (e) {
          console.warn("Failed to re-fetch user details after update", e);
        }
      }

      if (finalUser) {
        const userImage =
          finalUser?.image ||
          `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(
            `${finalUser.firstName || ""} ${finalUser.lastName || ""}`.trim()
          )}`;

        const payloadToSet = { ...finalUser, image: userImage };
        dispatch(setUser(payloadToSet));
        localStorage.setItem("user", JSON.stringify(payloadToSet));
      }

      toast.success("Profile Updated Successfully");
      return finalUser;
    } catch (error) {
      console.error("UPDATE_PROFILE_API ERROR", error);
      toast.error(error?.message || "Could Not Update Profile");
      return null;
    } finally {
      toast.dismiss(toastId);
    }
  };
}

export async function changePassword(token, formData) {
  const toastId = toast.loading("Changing password...");
  try {
    const response = await apiConnector("POST", CHANGE_PASSWORD_API, formData, {
      Authorization: `Bearer ${token}`,
    });
    if (!response?.data?.success) {
      throw new Error(response?.data?.message);
    }
    toast.success("Password Changed Successfully");
    return true;
  } catch (error) {
    console.error("CHANGE_PASSWORD_API ERROR", error);
    toast.error(error?.response?.data?.message || "Could not change password");
    return false;
  } finally {
    toast.dismiss(toastId);
  }
}

export function deleteProfile(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Deleting profile...");
    try {
      const response = await apiConnector("DELETE", DELETE_PROFILE_API, null, {
        Authorization: `Bearer ${token}`,
      });
      if (!response?.data?.success) {
        throw new Error(response?.data?.message);
      }
      toast.success("Profile Deleted Successfully");
      dispatch(logout(navigate));
      return true;
    } catch (error) {
      console.error("DELETE_PROFILE_API ERROR", error);
      toast.error("Could Not Delete Profile");
      return false;
    } finally {
      toast.dismiss(toastId);
    }
  };
}
