"use client";

import { useState } from "react";
import { supabase } from '../lib/supabaseClient'
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
      <div className="bg-[#202c33] p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-white text-2xl font-bold text-center mb-6">Login</h2>
        {error && <p className="text-red-400 text-center mb-4">{error}</p>}
        <input 
          placeholder="Email" 
          value={email} 
          onChange={e=>setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-[#2a3942] border border-[#3d4b53] rounded-lg text-white placeholder-[#8696a0] outline-none"
        />
        <input 
          placeholder="Senha" 
          type="password" 
          value={password} 
          onChange={e=>setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-[#2a3942] border border-[#3d4b53] rounded-lg text-white placeholder-[#8696a0] outline-none"
        />
        <button 
          onClick={handleLogin}
          className="w-full bg-[#00a884] hover:bg-[#06cf91] text-white py-3 rounded-lg font-medium transition-colors"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}