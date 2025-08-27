import { toast } from "react-hot-toast";
import { apiConnector } from "@/shared/services/api/apiConnector";
import { courseEndpoints } from "@/app/config/apis";
import { createSlice } from "@reduxjs/toolkit";

const {
  COURSE_DETAILS_API,
  COURSE_CATEGORIES_API,
  GET_ALL_COURSE_API,
  CREATE_COURSE_API,
  EDIT_COURSE_API,
  CREATE_SECTION_API,
  CREATE_SUBSECTION_API,
  UPDATE_SECTION_API,
  UPDATE_SUBSECTION_API,
  DELETE_SECTION_API,
  DELETE_SUBSECTION_API,
  GET_ALL_INSTRUCTOR_COURSES_API,
  DELETE_COURSE_API,
  GET_FULL_COURSE_DETAILS_AUTHENTICATED,
  CREATE_RATING_API,
  LECTURE_COMPLETION_API,
} = courseEndpoints;

const initialState = {
  courseSectionData: [],
  courseEntireData: [],
  completedLectures: [],
  totalNoOfLectures: 0,
};

const viewCourseSlice = createSlice({
  name: "viewCourse",
  initialState,
  reducers: {
    setCourseSectionData: (state, action) => {
      state.courseSectionData = action.payload;
    },
    setEntireCourseData: (state, action) => {
      state.courseEntireData = action.payload;
    },
    setTotalNoOfLectures: (state, action) => {
      state.totalNoOfLectures = action.payload;
    },
    setCompletedLectures: (state, action) => {
      state.completedLectures = action.payload;
    },
    updateCompletedLectures: (state, action) => {
      state.completedLectures = [...state.completedLectures, action.payload];
    },
  },
});

export const {
  setCourseSectionData,
  setEntireCourseData,
  setTotalNoOfLectures,
  setCompletedLectures,
  updateCompletedLectures,
} = viewCourseSlice.actions;

export default viewCourseSlice.reducer;


export const getAllCourses = async ({
  categoryId = "",
  page = 1,
  limit = 12,
  search = "",
  filters = {},
}: {
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, any>;
} = {}) => {
  const toastId = toast.loading("Loading");
  console.log("filter for API: ", filters);
  let result: { data: any[]; total: number; success: boolean } = {
    data: [],
    total: 0,
    success: false,
  };

  try {
    const params = new URLSearchParams();

    if (categoryId) params.append("categoryId", categoryId);
    params.append("page", String(page));
    params.append("limit", String(limit));

    if (search) params.append("search", search);

    if (filters?.price) params.append("price", String(filters.price));
    if (filters?.level) params.append("level", String(filters.level));
    if (filters?.sort) params.append("sort", String(filters.sort));
    if (filters?.instructorId) params.append("instructorId", String(filters.instructorId));

    const url = `${GET_ALL_COURSE_API}?${params.toString()}`;

    const response = await apiConnector("GET", url);

    console.log("GET_ALL_COURSE_API (paginated) RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Could not fetch courses");
    }

    const payload = response.data.data ?? [];
    if (Array.isArray(payload)) {
      result = { data: payload, total: payload.length, success: true };
    } else {
      result = {
        data: payload.courses ?? payload.items ?? [],
        total: Number(payload.total ?? payload.count ?? (payload.courses?.length ?? 0)),
        success: true,
      };
    }
  } catch (error: any) {
    console.error("GET_ALL_COURSE_API PAGINATED ERROR............", error);
    toast.error(error?.message ?? "Failed to load courses");
  } finally {
    toast.dismiss(toastId);
  }

  return result;
};

export const fetchCourseDetails = async (courseId) => {
  let result = null;

  try {
    const response = await apiConnector("POST", COURSE_DETAILS_API, {
      courseId,
    });
    console.log("COURSE_DETAILS_API API RESPONSE............", response);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    result = response.data;
  } catch (error) {
    console.log("COURSE_DETAILS_API API ERROR............", error);
    result = error.response?.data ?? { success: false, message: error.message };
  }
  return result;
};

export const fetchCourseCategories = async () => {
  let result = [];

  try {
    const response = await apiConnector("GET", COURSE_CATEGORIES_API);
    console.log("COURSE_CATEGORIES_API RESPONSE............", response);
    if (!response?.data?.success) {
      throw new Error("Could Not Fetch Course Categories");
    }
    result = response?.data?.data;
  } catch (error) {
    console.log("COURSE_CATEGORY_API API ERROR............", error);
    toast.error(error.message);
  }
  return result;
};

export const addCourseDetails = async (data, token) => {
  const toastId = toast.loading("Loading");
  let result = null;

  try {
    const response = await apiConnector("POST", CREATE_COURSE_API, data, {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    });
    console.log("CREATE COURSE API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Add Course Details");
    }

    result = response?.data?.data;
    toast.success("Course Details Added Successfully");
  } catch (error) {
    console.log("CREATE COURSE API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const editCourseDetails = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", EDIT_COURSE_API, data, {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    });
    console.log("EDIT COURSE API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Update Course Details");
    }

    result = response?.data?.data;
    toast.success("Course Details Updated Successfully");
  } catch (error) {
    console.log("EDIT COURSE API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const createSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", CREATE_SECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("CREATE SECTION API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Create Section");
    }

    result = response?.data?.updatedCourseDetails;
    toast.success("Course Section Created");
  } catch (error) {
    console.log("CREATE SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const createSubSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", CREATE_SUBSECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("CREATE SUB-SECTION API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Add Lecture");
    }

    result = response?.data?.data;
    toast.success("Lecture Added");
  } catch (error) {
    console.log("CREATE SUB-SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const updateSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", UPDATE_SECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("UPDATE SECTION API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Update Section");
    }

    result = response?.data?.data;
    toast.success("Course Section Updated");
  } catch (error) {
    console.log("UPDATE SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const updateSubSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", UPDATE_SUBSECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("UPDATE SUB-SECTION API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Update Lecture");
    }

    result = response?.data?.data;
    toast.success("Lecture Updated");
  } catch (error) {
    console.log("UPDATE SUB-SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const deleteSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");

  try {
    const response = await apiConnector("POST", DELETE_SECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("DELETE SECTION API RESPONSE............", response);

    if (!response?.data?.success) {
      throw new Error("Could Not Delete Section");
    }

    result = response?.data?.data;
    toast.success("Course Section Deleted");
  } catch (error) {
    console.log("DELETE SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const deleteSubSection = async (data, token) => {
  let result = null;
  const toastId = toast.loading("Loading");
  try {
    const response = await apiConnector("POST", DELETE_SUBSECTION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("DELETE SUB-SECTION API RESPONSE............", response);
    if (!response?.data?.success) {
      throw new Error("Could Not Delete Lecture");
    }
    result = response?.data?.data;
    toast.success("Lecture Deleted");
  } catch (error) {
    console.log("DELETE SUB-SECTION API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return result;
};

export const fetchInstructorCourses = async (token) => {
  let result = [];

  try {
    const response = await apiConnector(
      "GET",
      GET_ALL_INSTRUCTOR_COURSES_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );
    console.log("INSTRUCTOR COURSES API RESPONSE", response);
    if (!response?.data?.success) {
      throw new Error("Could Not Fetch Instructor Courses");
    }
    result = response?.data?.data;
  } catch (error) {
    console.log("INSTRUCTOR COURSES API ERROR............", error);
    toast.error(error.message);
  }
  return result;
};

export const deleteCourse = async (data, token) => {
  try {
    const response = await apiConnector("DELETE", DELETE_COURSE_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("DELETE COURSE API RESPONSE............", response);
    if (!response?.data?.success) {
      throw new Error("Could Not Delete Course");
    }
    toast.success("Course Deleted");
  } catch (error) {
    console.log("DELETE COURSE API ERROR............", error);
    toast.error(error.message);
  }
};

export const getFullDetailsOfCourse = async (courseId, token) => {
  let result = null;
  try {
    const response = await apiConnector(
      "POST",
      GET_FULL_COURSE_DETAILS_AUTHENTICATED,
      {
        courseId,
      },
      {
        Authorization: `Bearer ${token}`,
      }
    );
    console.log("COURSE_FULL_DETAILS_API API RESPONSE............", response);

    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    result = response?.data?.data;
  } catch (error) {
    console.log("COURSE_FULL_DETAILS_API API ERROR............", error);
    result = error.response?.data ?? { success: false, message: error.message };
  }
  return result;
};

export const markLectureAsComplete = async (data, token) => {
  let result = false;
  const toastId = toast.loading("Loading");
  try {
    const response = await apiConnector("POST", LECTURE_COMPLETION_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log(
      "MARK_LECTURE_AS_COMPLETE_API API RESPONSE............",
      response
    );

    if (!response.data.message) {
      throw new Error(response.data.error);
    }
    toast.success("Lecture Completed");
    result = true;
  } catch (error) {
    console.log("MARK_LECTURE_AS_COMPLETE_API API ERROR............", error);
    toast.error(error.message);
    result = false;
  }
  toast.dismiss(toastId);
  return result;
};

export const createRating = async (data, token) => {
  const toastId = toast.loading("Loading");
  let success = false;
  try {
    const response = await apiConnector("POST", CREATE_RATING_API, data, {
      Authorization: `Bearer ${token}`,
    });
    console.log("CREATE RATING API RESPONSE............", response);
    if (!response?.data?.success) {
      throw new Error("Could Not Create Rating");
    }
    toast.success("Rating Created");
    success = true;
  } catch (error) {
    success = false;
    console.log("CREATE RATING API ERROR............", error);
    toast.error(error.message);
  }
  toast.dismiss(toastId);
  return success;
};
