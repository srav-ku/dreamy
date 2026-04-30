import { useState } from "react";
import { useLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function Login() {
  const [password, setPassword] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(password);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Album Admin</h1>
          <p className="text-[#71767B] mt-2 text-sm">Enter password to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={login.isPending}
            className="w-full bg-black border-[#2F3336] focus-visible:ring-1 focus-visible:ring-[#1d9bf0] text-white rounded-md px-4 py-6 text-lg placeholder:text-[#71767B]"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={login.isPending || !password}
            className="w-full rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold py-6 text-base"
          >
            {login.isPending ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
