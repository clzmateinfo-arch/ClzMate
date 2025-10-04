import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    step: 1,
    quiz: null,
    editQuiz: false,
};

const slice = createSlice({
    name: "quiz",
    initialState,
    reducers: {
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

export const { setStepQuiz, setQuiz, setEditQuiz, resetQuizState } = slice.actions;
export default slice.reducer;
