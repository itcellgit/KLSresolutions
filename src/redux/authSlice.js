import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login, storeAuth, logout } from '../api/auth';

export const loginUser = createAsyncThunk('auth/loginUser', async ({ username, password }, thunkAPI) => {
  try {
    const data = await login(username, password);
    storeAuth(data);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.error || 'Login failed');
  }
});

const initialState = {
  user: null,
  roles: [],
  token: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutUser: (state) => {
      logout();
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
