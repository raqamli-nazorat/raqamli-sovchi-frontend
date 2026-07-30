import { createSlice } from "@reduxjs/toolkit";

interface CurrentUser {
  id: number;
  username: string;
  role: string | null;
  employee_id: number | null;
  employee_fio: string | null;
  region_id: number | null;
  region_name: string | null;
  district_id: number | null;
  district_name: string | null;
  districts: { id: number, name: string }[] | any;
  photo_url: string | null;
  phone: string | null;
  permissions: string[];
  email: string;
  confirmPassword: string | null;
}

interface Permissions {
  directory: {
    title: string;
    entity_type: string;
    data: {
      id: number;
      codename: string;
      assigned: boolean
    }[]
  }
  documents: {
    title: string;
    model: string;
    data: {
        id: number;
        codename: string;
        assigned: boolean;
      }[]
  }[]
}

interface IState {
  permission: Permissions | null;
  currentUser: CurrentUser | null;
}

const initialState: IState = {
  permission: null,
  currentUser: null,
};

const referencesSlice = createSlice({
  name: "referencesSlice",
  initialState,
  reducers: {
    setUserPermission: (state, { payload }) => {
      state.permission = payload;
    },
    setCurrentUser: (state, { payload }) => {
      state.currentUser = payload;
    },
  },
});

export const { setUserPermission, setCurrentUser } = referencesSlice.actions;

export default referencesSlice.reducer;