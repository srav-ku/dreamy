import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/auth-context";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";

export default function Login() {
  const { user, login, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation("/persons");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-12">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Album Admin</h1>
          <p className="text-[#71767B] mt-3 text-base">Sign in to manage your portfolio</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={login}
            disabled={loading}
            className="w-full rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold py-6 text-base flex items-center justify-center gap-3"
          >
            {loading ? (
              "Checking session..."
            ) : (
              <>
                <Chrome className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </Button>
          
          <p className="text-[11px] text-[#71767B] px-8">
            Only authorized administrator emails can access this portal.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
