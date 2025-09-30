"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import '../../globals.css'

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) setError(error.message);
    else router.push("/chat");
  };

  return (
    <div className="container">
      <h2 style={{ textAlign: "center", marginBottom: "20px", color:"#28a745" }}>Cadastro</h2>
      {error && <p style={{ color: "red", textAlign:"center" }}>{error}</p>}
      <input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button onClick={handleSignup}>Cadastrar</button>
      <p style={{ textAlign:"center", marginTop:"10px" }}>Já tem conta? <a href="/" style={{color:"#28a745"}}>Login</a></p>
    </div>
  );
}
