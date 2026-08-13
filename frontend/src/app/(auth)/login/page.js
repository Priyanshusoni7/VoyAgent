"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageWrapper from "@/components/layout/PageWrapper";
import { login } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");

    try {
      setLoading(true);
      const data = await login({ email, password });
      toast.success(data.message);
      router.push("/dashboard");
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
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-[#d4603a]" />
          <span className="text-lg font-bold tracking-tight">VoyAgent</span>
        </div>

        {/* Quote */}
        <div>
          <p className="text-3xl font-bold leading-snug text-white mb-4">
            Your AI travel team, <br />
            working <span className="text-[#d4603a]">in parallel</span>.
          </p>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm">
            Hotels, flights and day-by-day itineraries — researched simultaneously
            by three specialist AI agents, delivered in seconds.
          </p>
        </div>

        {/* Bottom caption */}
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

          <h1 className="text-2xl font-bold text-[#1a1714] mb-1">Welcome back</h1>
          <p className="text-sm text-[#7a6f65] mb-8">Sign in to continue planning your trips.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="••••••••"
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

            <div className="flex justify-end">
              <button type="button" className="text-xs text-[#d4603a] hover:underline">
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={loading} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-[#7a6f65] mt-6">
            No account yet?{" "}
            <Link href="/signup" className="text-[#d4603a] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
    </PageWrapper>
  );
}