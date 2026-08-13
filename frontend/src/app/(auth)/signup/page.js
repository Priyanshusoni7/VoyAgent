"use client";

import React, { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageWrapper from "@/components/layout/PageWrapper";
import { signup } from "@/services/auth.service";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword)
      return toast.error("Please fill all fields");
    if (password !== confirmPassword)
      return toast.error("Passwords do not match");

    try {
      setLoading(true);
      const data = await signup({ name, email, password });
      toast.success(data.message);
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
    <div className="min-h-screen bg-[#f8f6f2] flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#1a1714] text-white p-12">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#d4603a]" />
          <span className="text-lg font-bold tracking-tight">VoyAgent</span>
        </div>

        <div>
          <p className="text-3xl font-bold leading-snug text-white mb-4">
            Three agents. <br />
            One perfect <span className="text-[#d4603a]">trip plan</span>.
          </p>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm">
            Just tell us where you want to go. Our Hotel, Flight, and Itinerary
            specialists handle the rest — simultaneously.
          </p>
        </div>

        <p className="text-xs text-white/30">© 2025 VoyAgent</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <MapPin className="w-5 h-5 text-[#d4603a]" />
            <span className="text-lg font-bold text-[#1a1714]">VoyAgent</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1a1714] mb-1">Create your account</h1>
          <p className="text-sm text-[#7a6f65] mb-8">Start planning trips with AI in seconds.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              id="name"
              type="text"
              placeholder="Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
            />

            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#7a6f65] hover:text-[#1a1714] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-[#7a6f65] hover:text-[#1a1714] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" loading={loading} disabled={loading} className="mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7a6f65] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#d4603a] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}