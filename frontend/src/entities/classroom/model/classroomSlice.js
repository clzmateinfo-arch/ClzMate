import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    step: 1,
    assignment: null,
    editAssignment: false,
    quiz: null,
    editQuiz: false,
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
    },
});

export const { setStep, setAssignment, setEditAssignment, resetAssignmentState, setStepQuiz, setQuiz, setEditQuiz, resetQuizState } = slice.actions;
export default slice.reducer;
