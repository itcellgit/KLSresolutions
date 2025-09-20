import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
// Members pages imports
import Dashboard from "./pages/members/Dashboard";
import GCResolutionPage from "./pages/members/GCResolutionPage";
import BOMResolutionPage from "./pages/members/BOMResolutionPage";
import AGMResolutionPage from "./pages/members/AGMResolutionPage";
// Institute admin pages
import InstituteAdminDashboard from "./instituteadmin/Dashboard";
import AddGCResolution from "./instituteadmin/AddGCResolution";
import BOMResolutionsInstitute from "./instituteadmin/BOMResolutions";
import MembersInstitute from "./instituteadmin/Members";
import AddAGM from "./instituteadmin/AddAGM";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute"; // Import the Redux-based PrivateRoute

function App() {
  return (
    <Router>
      <Routes>
        {/* Root route - handles authentication-based redirect */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navigate to="/login" />
            </PrivateRoute>
          }
        />
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} /> */}

        {/* Member dashboard/cards routes with DashboardLayout */}
        <Route
          path="/member/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/member/agm-resolutions"
          element={
            // <PrivateRoute>
            <DashboardLayout>
              <AGMResolutionPage />
            </DashboardLayout>
            // </PrivateRoute>
          }
        />
        <Route
          path="/member/gc-resolutions"
          element={
            // <PrivateRoute>
            <DashboardLayout>
              <GCResolutionPage />
            </DashboardLayout>
            // </PrivateRoute>
          }
        />
        <Route
          path="/member/bom-resolutions"
          element={
            // <PrivateRoute>
            <DashboardLayout>
              <BOMResolutionPage />
            </DashboardLayout>
            // </PrivateRoute>
          }
        />

        {/* Institute Admin Routes */}
        <Route
          path="/instituteadmin/dashboard"
          element={
            <PrivateRoute>
              <InstituteAdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/instituteadmin/add-gc-resolution"
          element={
            <PrivateRoute>
              <AddGCResolution />
            </PrivateRoute>
          }
        />
        <Route
          path="/instituteadmin/bom-resolutions"
          element={
            <PrivateRoute>
              <BOMResolutionsInstitute />
            </PrivateRoute>
          }
        />
        <Route
          path="/instituteadmin/members"
          element={
            <PrivateRoute>
              <MembersInstitute />
            </PrivateRoute>
          }
        />
        <Route
          path="/instituteadmin/add-agm"
          element={
            <PrivateRoute>
              <AddAGM />
            </PrivateRoute>
          }
        />

        {/* Routes with Layout */}
        <Route
          path="/klsadmin/institutes"
          element={
            <PrivateRoute>
              <Layout>
                <InstitutePage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/AGM"
          element={
            <PrivateRoute>
              <Layout>
                <AGM />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/members"
          element={
            <PrivateRoute>
              <Layout>
                <Members />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Admin routes with Layout - now protected */}
        <Route
          path="/klsadmin/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/assignrole"
          element={
            <PrivateRoute>
              <Layout>
                <AssignRole />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/memberrole"
          element={
            <PrivateRoute>
              <Layout>
                <MemberRole />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/gcresolution"
          element={
            <PrivateRoute>
              <Layout>
                <GCResolution />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/klsadmin/bomresolutions"
          element={
            <PrivateRoute>
              <Layout>
                <BOMResolutions />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Catch-all route - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
