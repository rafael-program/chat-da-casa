"use client";

import { useState } from "react";
import { supabase } from '../lib/supabaseClient'
import { useRouter } from "next/navigation";
import "./globals.css";

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
    <div className="container">
      <h2>Login</h2>
      {error && <p style={{ color: "red", textAlign:"center" }}>{error}</p>}
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleLogin}>Entrar</button>
      <p style={{ textAlign:"center" }}>Não tem conta? <a href="/signup">Cadastre-se</a></p>
    </div>
  );
}
