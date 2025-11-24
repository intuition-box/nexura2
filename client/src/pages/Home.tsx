import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  const [, setLocation] = useLocation();

  return (
<div
  className="min-h-screen flex flex-col items-center justify-center bg-black bg-cover bg-center px-4 sm:px-6"
  style={{
    backgroundImage: `url("/nexura-img.jpg")`,
  }}
>
  <div className="backdrop-blur-md bg-black/60 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-16 w-full max-w-xl text-center space-y-6 sm:space-y-10">
   {/* Logo */}
<img
  src="/nexura-img.jpg"
  alt="Nexura Logo"
  className="mx-auto w-48 h-48 object-contain rounded-[20px] bg-transparent"
/>

        <h1 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">
          Welcome to <span className="text-blue-400">Nexura</span>
        </h1>
        <p className="text-white/70 text-sm sm:text-lg">
          Log in or register to explore the ecosystem, track your achievements, and connect with the community.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6">
          <Button
            onClick={() => setLocation("/discover")}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-transform"
          >
            Login
          </Button>
          <Button
            onClick={() => setLocation("/profile")}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-5 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-transform"
          >
          Sign Up
          </Button>
        </div>

        <Button
          onClick={() => setLocation("/discover")}
          className="mt-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-5 sm:px-10 py-3 sm:py-4 text-sm sm:text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-transform"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
