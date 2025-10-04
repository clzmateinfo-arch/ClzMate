import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    step: 1,
    assignment: null,
    editAssignment: false,
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
    },
});

export const { setStep, setAssignment, setEditAssignment, resetAssignmentState } = slice.actions;
export default slice.reducer;
