import { toast } from "react-hot-toast";
import { setLoading, setUser } from "@/entities/user/model/userSlice";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { profileEndpoints } from "@/app/config/apis";
import { logout } from "@/entities/auth/model/authAPI";

const {
  GET_USER_DETAILS_API,
  GET_USER_ENROLLED_COURSES_API,
  GET_INSTRUCTOR_DATA_API,
} = profileEndpoints;

export function getUserDetails(token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading");
    dispatch(setLoading(true));
    try {
      console.log("GET_USER_DETAILS_API ............", GET_USER_DETAILS_API);
      const response = await apiConnector("GET", GET_USER_DETAILS_API, null, {
        Authorization: `Bearer ${token}`,
      });
      console.log("GET_USER_DETAILS API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      const userImage = response.data.data.image
        ? response.data.data.image
        : `https://api.dicebear.com/5.x/initials/svg?seed=${response.data.data.firstName} ${response.data.data.lastName}`;
      dispatch(setUser({ ...response.data.data, image: userImage }));
    } catch (error) {
      dispatch(logout(navigate));
      console.log("GET_USER_DETAILS API ERROR............", error);
      toast.error("Could Not Get User Details");
    }
    toast.dismiss(toastId);
    dispatch(setLoading(false));
  };
}


// export async function getUserEnrolledCourses(token) {
//   let result = [];
//   try {
//     const response = await apiConnector(
//       "GET",
//       GET_USER_ENROLLED_COURSES_API,
//       { token },
//       { Authorization: `Bearer ${token}` }
//     );

//     console.log(
//       "GET_USER_ENROLLED_COURSES_API API RESPONSE............",
//       response
//     );

//     if (!response.data.success) {
//       throw new Error(response.data.message);
//     }
//     result = response.data.data;
//   } catch (error) {
//     console.log("GET_USER_ENROLLED_COURSES_API API ERROR............", error);
//     toast.error("Could Not Get Enrolled Courses");
//   }
//   return result;
// }

export async function getUserEnrolledCourses({
  token,
  page = 1,
  limit = 10,
  search = "",
}: {
  token: string;
  page?: number;
  limit?: number;
  search?: string;
}) {
  let result = { data: [], total: 0, success: false };

  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (search) params.append("search", search);

    const url = `${GET_USER_ENROLLED_COURSES_API}?${params.toString()}`;

    const response = await apiConnector("GET", url, null, {
      Authorization: `Bearer ${token}`,
    });

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch courses");
    }

    result = {
      data: response.data.data?.courses ?? [],
      total: response.data.data?.total ?? 0,
      success: true,
    };
  } catch (error: any) {
    console.error("GET_USER_ENROLLED_COURSES_API ERROR............", error);
    toast.error(error?.message ?? "Could Not Get Enrolled Courses");
  }

  return result;
}

export async function getInstructorData(token) {
  let result = [];
  try {
    const response = await apiConnector("GET", GET_INSTRUCTOR_DATA_API, null, {
      Authorization: `Bearer ${token}`,
    });
    console.log("GET_INSTRUCTOR_DATA_API API RESPONSE............", response);
    result = response?.data?.courses;
  } catch (error) {
    console.log("GET_INSTRUCTOR_DATA_API API ERROR............", error);
    toast.error("Could Not Get Instructor Data");
  }
  return result;
}
