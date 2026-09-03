import { configureStore } from '@reduxjs/toolkit';
import referencesSlice from './slices/referencesSlice';
import appealsSlice from './slices/appealsSlice';
import notificationsSlice from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    references: referencesSlice,
    appeals: appealsSlice,
    notifications: notificationsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
