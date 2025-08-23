import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  step: 1,
  course: null,
  editCourse: false,
  paymentLoading: false,
  courseSectionData: [],
  courseEntireData: [],
  completedLectures: [],
  totalNoOfLectures: 0,
};

const courseSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setStep: (state, action) => {
      state.step = action.payload;
    },
    setCourse: (state, action) => {
      state.course = action.payload;
    },
    setEditCourse: (state, action) => {
      state.editCourse = action.payload;
    },
    setPaymentLoading: (state, action) => {
      state.paymentLoading = action.payload;
    },

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

    resetCourseState: (state) => {
      state.step = 1;
      state.course = null;
      state.editCourse = false;
      state.paymentLoading = false;

      state.courseSectionData = [];
      state.courseEntireData = [];
      state.completedLectures = [];
      state.totalNoOfLectures = 0;
    },
  },
});

export const {
  setStep,
  setCourse,
  setEditCourse,
  setPaymentLoading,

  setCourseSectionData,
  setEntireCourseData,
  setTotalNoOfLectures,
  setCompletedLectures,
  updateCompletedLectures,

  resetCourseState,
} = courseSlice.actions;

export default courseSlice.reducer;
