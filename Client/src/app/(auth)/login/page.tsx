"use client";

import "./login.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthService } from "@/services/auth.service";
import { authManager } from "@/lib/auth-manager";
import { Eye, EyeClosed, EyeOff } from "lucide-react";
import { useState } from "react";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Enter Password"),
});

const GOOGLE_OAUTH_URL = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_OAUTH_URL;
  };

const onSubmit = async (values: any) => {
  try {
    const response = await AuthService.login(values);
    const userRole = response.data?.user?.role;

    authManager.setAuth(response.data.tokens);

    if (userRole === "ADMIN") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/dashboard";
    }
  } catch (error: any) {
    // Error toast is already shown by the axios response interceptor
  }
};


  return (
    <div className="login-page">
    <div className="auth-wrapper">
      <div className="auth-modal">
        {/* LEFT PART – Same as Register Page */}
        <div className="auth-left">
          <div className="logo-circle">
            <img src="/logo.png" alt="Logo" className="logo-img" />
          </div>
          <h2 className="welcome-title">Welcome Back,</h2>
          <p className="welcome-sub">Login to continue raising players</p>
        </div>

        {/* RIGHT PART */}
        <div className="auth-right">
          <h2 className="title">Login to Your Account</h2>

          {/* Social Login */}
          <div className="social-section">
            <button
              type="button"
              className="btn btn-social btn-google"
              onClick={handleGoogleLogin}
            >
              <span className="social-icon-circle">G</span>
              <span className="btn-text">Login with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          {/* FORM */}
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <div className="input-group">
              <input
                placeholder="Email"
                type="email"
                {...register("email")}
                className={`input-field ${errors.email ? "input-error" : ""}`}
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <div className="password-wrapper">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`input-field ${errors.password ? "input-error" : ""
                    }`}
                />

                <button
                  type="button"
                  className="password-toggle-button"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff width={20} height={20} />
                  ) : (
                    <Eye width={20} height={20} />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>


            {/* Submit */}
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="forgot-password-text">
            <a href="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </a>
          </p>
          <p className="login-text">
            Don’t have an account?{" "}
            <a href="/register" className="link">
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}