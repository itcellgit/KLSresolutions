import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useSelector } from "react-redux";
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
import Layout from "./components/Layout";

// Private route wrapper using Redux
function PrivateRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
    </Provider>
  );
}

export default App;
