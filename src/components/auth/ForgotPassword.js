import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../../api/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await forgotPassword(email);
      setMessage(response.message || "OTP sent to your email successfully!");
      // Redirect to reset password page after successful OTP send
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000); // Wait 2 seconds to show success message
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
            Karnatak Law Society
          </h1>
          <p className="text-gray-600 text-center text-base md:text-lg mb-2">
            Enter your email address to receive an OTP for password reset.
          </p>
        </div>

        <h2 className="mb-8 text-2xl font-bold text-center text-gray-800">
          Forgot Password
        </h2>

        {error && (
          <div className="p-2 mb-4 text-sm font-medium text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="p-2 mb-4 text-sm font-medium text-green-600 bg-green-100 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-base">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-base"
              placeholder="Enter your registered email"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition text-lg"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center">
          <Link
            to="/login"
            className="text-indigo-600 hover:underline text-sm md:text-base mb-2"
          >
            Back to Login
          </Link>
          {/* {message && (
            <p className="text-green-600 text-sm text-center mt-2">
              Redirecting to reset password page...
            </p>
          )} */}
          <div className="text-xs text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Karnatak Law Society. All rights
            reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
