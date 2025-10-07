import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    step: 1,
    assignment: null,
    editAssignment: false,
    quiz: null,
    editQuiz: false,
    linkCourse: null,
    editLinkCourse: false,
};

const slice = createSlice({
    name: "classroom",
    initialState,
    reducers: {
        setStep(state, action) {
            state.step = action.payload;
        },
        setAssignment(state, action) {
            state.assignment = action.payload;
        },
        setEditAssignment(state, action) {
            state.editAssignment = action.payload;
        },
        resetAssignmentState(state) {
            state.step = 1;
            state.assignment = null;
            state.editAssignment = false;
        },
        setStepQuiz(state, action) {
            state.step = action.payload;
        },
        setQuiz(state, action) {
            state.quiz = action.payload;
        },
        setEditQuiz(state, action) {
            state.editQuiz = action.payload;
        },
        resetQuizState(state) {
            state.step = 1;
            state.quiz = null;
            state.editQuiz = false;
        },

        setLinkCourse(state, action) {
            state.linkCourse = action.payload;
        },
        setEditLinkCourse(state, action) {
            state.editLinkCourse = action.payload;
        },
        resetLinkCourseState(state) {
            state.step = 1;
            state.linkCourse = null;
            state.editLinkCourse = false;
        },
    },
});

export const {
    setStep,
    setAssignment,
    setEditAssignment,
    resetAssignmentState,
    setStepQuiz,
    setQuiz,
    setEditQuiz,
    resetQuizState,
    setLinkCourse,
    setEditLinkCourse,
    resetLinkCourseState,
} = slice.actions;
export default slice.reducer;
