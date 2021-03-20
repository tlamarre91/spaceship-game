import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../store";
const TEST_ACTION = "TEST_ACTION";

interface AppState {
  testKey: string
}

const initialState = {
  testKey: "textValue"
}

export const stateSlice = createSlice({
  name: "testSlice",
  initialState,
  reducers: {
    append: (state, action: PayloadAction<string>) => {
      state.testKey = state.testKey + action.payload;
    },
    clear: (state) => {
      state.testKey = "";
    },
    appendRandom: (state) => {
      state.testKey = state.testKey + (Math.random() > 0.5 ? "A" : "B");
    }
  }
});

export const { append, clear, appendRandom } = stateSlice.actions;

export const selectValue = (state: RootState) => state.testKey; // ?????? no types?

export default stateSlice.reducer;
