import { configureStore } from '@reduxjs/toolkit';
import referencesSlice from './slices/referencesSlice';
import appealsSlice from './slices/appealsSlice';

export const store = configureStore({
  reducer: {
    references: referencesSlice,
    appeals: appealsSlice,
  },
});
