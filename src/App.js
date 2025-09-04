import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider, useAuth } from "./context/AuthContext";
import store from "./redux/store";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

import DashboardPage from "./pages/DashboardPage";
import InstitutePage from "./pages/InstitutePage";
import Members from "./pages/klsadmin/Members";
import AssignRole from "./pages/klsadmin/AssignRole";
import MemberRole from "./pages/klsadmin/MemberRole";
import GCResolution from "./pages/klsadmin/GCResolution";
import BOMResolutions from "./pages/klsadmin/BOMResolutions";
import AGM from "./pages/klsadmin/AGM";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/members/Dashboard";

// Institute admin pages
import InstituteAdminDashboard from "./instituteadmin/Dashboard";
import AddGCResolution from "./instituteadmin/AddGCResolution";
import BOMResolutionsInstitute from "./instituteadmin/BOMResolutions";
import MembersInstitute from "./instituteadmin/Members";
import AddAGM from "./instituteadmin/AddAGM";

import Layout from "./components/Layout";

// Member pages (create these files in your pages/member folder)

// ✅ Private route wrapper
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Member dashboard/cards routes with DashboardLayout */}
            <Route
              path="/member/dashboard"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/member/agm-resolutions"
              element={
                <DashboardLayout>
                  {/* AGM resolutions page component */}
                </DashboardLayout>
              }
            />
            <Route
              path="/member/gc-resolutions"
              element={
                <DashboardLayout>
                  {/* GC resolutions page component */}
                </DashboardLayout>
              }
            />
            <Route
              path="/member/bom-resolutions"
              element={
                <DashboardLayout>
                  {/* BOM resolutions page component */}
                </DashboardLayout>
              }
            />

            {/* Institute Admin Routes */}
            <Route path="/instituteadmin/dashboard" element={<InstituteAdminDashboard />} />
            <Route path="/instituteadmin/add-gc-resolution" element={<AddGCResolution />} />
            <Route path="/instituteadmin/bom-resolutions" element={<BOMResolutionsInstitute />} />
            <Route path="/instituteadmin/members" element={<MembersInstitute />} />
            <Route path="/instituteadmin/add-agm" element={<AddAGM />} />

            {/* Routes with Layout */}
            <Route
              path="/klsadmin/institutes"
              element={
                <Layout>
                  <InstitutePage />
                </Layout>
              }
            />
   
      <Route
              path="/klsadmin/AGM"
              element={
                <Layout>
                  <AGM />
                </Layout>
              }
            />

            <Route
              path="/members"
              element={
                <Layout>
                  <Members />
                </Layout>
              }
            />

            {/* Admin routes with Layout */}
            <Route
              path="/klsadmin/dashboard"
              element={
                // <PrivateRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
                // </PrivateRoute>
              }
            />

            <Route
              path="/klsadmin/assignrole"
              element={
                // <PrivateRoute>
                <Layout>
                  <AssignRole />
                </Layout>
                // </PrivateRoute>
              }
            />

            <Route
              path="/klsadmin/memberrole"
              element={
                // <PrivateRoute>
                <Layout>
                  <MemberRole />
                </Layout>
                // </PrivateRoute>
              }
            />
            <Route
              path="/klsadmin/gcresolution"
              element={
                // <PrivateRoute>
                <Layout>
                  <GCResolution />
                </Layout>
                // </PrivateRoute>
              }
            />

            <Route
              path="/klsadmin/bomresolutions"
              element={
                // <PrivateRoute>
                <Layout>
                  <BOMResolutions />
                </Layout>
                // </PrivateRoute>
              }
            />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/klsadmin/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
