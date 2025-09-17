import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { login, storeAuth, logout } from "../api/auth";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ username, password }, thunkAPI) => {
    try {
      const data = await login(username, password);
      storeAuth(data);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Login failed"
      );
    }
  }
);

const storedAuth =
  JSON.parse(sessionStorage.getItem("auth")) ||
  JSON.parse(localStorage.getItem("auth")) ||
  {};

const initialState = {
  user: storedAuth.user || null,
  roles: storedAuth.roles || [],
  token: storedAuth.token || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      logout();
      sessionStorage.removeItem("auth");
      localStorage.removeItem("auth");
      state.user = null;
      state.roles = [];
      state.token = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.roles = action.payload.roles;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logoutUser } = authSlice.actions;
export default authSlice.reducer;

// In your login/logout logic, also use sessionStorage instead of localStorage
