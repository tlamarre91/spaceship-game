import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import rootReducer from "./reducers";
import stateReducer from "./reducers"; 

export const store = configureStore({
  reducer: {
    stateReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
