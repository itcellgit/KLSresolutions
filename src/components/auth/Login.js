// Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../redux/authSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    user,
    loading,
    error: loginError,
  } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    dispatch(loginUser({ username: email, password }))
      .unwrap()
      .then((data) => {
        // Redirect based on user type from login API
        if (data.user.usertypeid === 1) {
          navigate("/klsadmin/dashboard");
          //navigate("/klsadmin/AGM");
        } else if (data.user.usertypeid === 2) {
          navigate("/instituteadmin/dashboard");
        } else if (data.user.usertypeid === 3) {
          navigate("/member/dashboard");
        } else {
          navigate("/login");
        }
      })
      .catch((err) => {
        setError(err);
      });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-lg p-10 md:p-12 sm:p-8 bg-white shadow-2xl rounded-3xl border border-gray-200 flex flex-col justify-center">
        <div className="flex flex-col items-center mb-8">
          <img
            src={process.env.PUBLIC_URL + "/image.png"}
            alt="KLS Resolutions Logo"
            className="w-20 h-20 mb-4 rounded-full shadow"
          />
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-2 text-center">
            Karnataka Law Society
          </h1>
          <p className="text-gray-600 text-center text-base md:text-lg mb-2">
            A secure portal for KLS management and institutions to view and
            manage all GC and BOM resolutions, AGMs, and members.
          </p>
        </div>
        <h2 className="mb-8 text-2xl font-bold text-center text-gray-800">
          Login
        </h2>
        {(error || loginError) && (
          <div className="p-2 mb-4 text-sm font-medium text-red-600 bg-red-100 rounded">
            {error || loginError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-base">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              placeholder="Enter your email"
            />
          </div>
          <div className="relative">
            <label className="block mb-2 font-medium text-gray-700 text-base">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clipRule="evenodd"
                  />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 flex flex-col items-center">
          <a
            href="#"
            className="text-indigo-600 hover:underline text-sm md:text-base mb-2"
          >
            Forgot Password?
          </a>
          <div className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Karnataka Law Society. All rights
            reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
