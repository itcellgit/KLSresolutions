import React, { useState, useCallback, memo } from "react";
import { changePassword } from "../api/auth";
import { useSelector } from "react-redux";

// Optimized PasswordField component outside the main component
const PasswordField = memo(
  ({
    label,
    name,
    value,
    onChange,
    error,
    showPassword,
    onToggleVisibility,
    placeholder,
    required = true,
    strengthIndicator = false,
  }) => (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className={`block w-full py-3 pl-4 pr-12 border ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          } rounded-lg transition-colors duration-200 sm:text-sm shadow-sm`}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-700 transition-colors duration-200"
          onClick={onToggleVisibility}
        >
          {showPassword ? (
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Password strength indicator for new password */}
      {strengthIndicator && value && name === "newPassword" && (
        <div className="mt-2">
          <div className="flex space-x-1">
            {[...Array(4)].map((_, i) => {
              const strength = getPasswordStrength(value);
              return (
                <div
                  key={i}
                  className={`h-1 w-full rounded ${
                    i < strength
                      ? strength === 1
                        ? "bg-red-500"
                        : strength === 2
                        ? "bg-yellow-500"
                        : strength === 3
                        ? "bg-blue-500"
                        : "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {getPasswordStrengthText(getPasswordStrength(value))}
          </p>
        </div>
      )}
    </div>
  )
);

// Password strength helper functions
const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 0:
    case 1:
      return "Weak password";
    case 2:
      return "Fair password";
    case 3:
      return "Good password";
    case 4:
      return "Strong password";
    default:
      return "";
  }
};

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);

  const token = useSelector((state) => state.auth.token);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => {
        const newFormData = {
          ...prev,
          [name]: value,
        };

        // Check if passwords match when either new password or confirm password changes
        if (name === "newPassword" || name === "confirmPassword") {
          const newPassword = name === "newPassword" ? value : prev.newPassword;
          const confirmPassword =
            name === "confirmPassword" ? value : prev.confirmPassword;

          // Show matching indicator if both fields have values and they match
          const doPasswordsMatch =
            newPassword.length >= 3 &&
            confirmPassword.length >= 3 &&
            newPassword === confirmPassword;

          // Show mismatch indicator if both fields have values but don't match
          const doPasswordsDontMatch =
            newPassword.length >= 3 &&
            confirmPassword.length >= 3 &&
            newPassword !== confirmPassword;

          setPasswordsMatch(doPasswordsMatch);
          setPasswordsDontMatch(doPasswordsDontMatch);
        }

        return newFormData;
      });

      // Only clear error for the specific field that's being typed in
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors]
  );

  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  // Create memoized toggle functions for each field to prevent recreation
  const toggleCurrentPassword = useCallback(
    () => togglePasswordVisibility("current"),
    [togglePasswordVisibility]
  );
  const toggleNewPassword = useCallback(
    () => togglePasswordVisibility("new"),
    [togglePasswordVisibility]
  );
  const toggleConfirmPassword = useCallback(
    () => togglePasswordVisibility("confirm"),
    [togglePasswordVisibility]
  );

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters long";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await changePassword(
        formData.currentPassword,
        formData.newPassword,
        token
      );

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordsMatch(false);
      setPasswordsDontMatch(false);

      // Call success callback
      if (onSuccess) {
        onSuccess("Password changed successfully!");
      }

      // Close modal
      onClose();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        "Failed to change password. Please try again.";
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form and errors when closing
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
    setPasswordsMatch(false);
    setPasswordsDontMatch(false);
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal content */}
        <div className="inline-block w-full max-w-md p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl sm:align-middle border border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-3">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold leading-6 text-gray-900">
                Change Password
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg p-1 transition-colors duration-200"
              disabled={isLoading}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              error={errors.currentPassword}
              showPassword={showPasswords.current}
              onToggleVisibility={toggleCurrentPassword}
              placeholder="Enter your current password"
            />

            <PasswordField
              label="New Password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              error={errors.newPassword}
              showPassword={showPasswords.new}
              onToggleVisibility={toggleNewPassword}
              placeholder="Enter your new password (min 6 characters)"
              strengthIndicator={true}
            />

            <PasswordField
              label="Confirm New Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              showPassword={showPasswords.confirm}
              onToggleVisibility={toggleConfirmPassword}
              placeholder="Confirm your new password"
            />

            {/* Password matching success indicator */}
            {passwordsMatch && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-green-600 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-800">
                    New and Confirm Password Match successfully
                  </p>
                </div>
              </div>
            )}

            {/* Password mismatch error indicator */}
            {passwordsDontMatch && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-red-800">
                    New and Confirm Password Doest Match
                  </p>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 text-red-600 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-red-600">
                    {errors.submit}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 text-sm font-medium text-white border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Changing...
                  </div>
                ) : (
                  "Change Password"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
