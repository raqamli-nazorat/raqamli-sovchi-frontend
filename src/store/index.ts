import { configureStore } from '@reduxjs/toolkit';
import referencesSlice from './slices/referencesSlice';

export const store = configureStore({
  reducer: {
    references: referencesSlice,
  },
});