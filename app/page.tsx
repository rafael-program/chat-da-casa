"use client";

import { useState } from "react";
import { supabase } from '../lib/supabaseClient'
import { useRouter } from "next/navigation";
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/chat");
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Header */}
        <div className={styles.loginHeader}>
          <div className={styles.loginLogo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h1 className={styles.logoText}>ChatApp</h1>
          </div>
          <h2 className={styles.loginTitle}>Bem-vindo de volta</h2>
          <p className={styles.loginSubtitle}>Entre na sua conta para continuar</p>
        </div>

        {/* Form */}
        <div className={styles.loginForm}>
          {error && (
            <div className={styles.errorMessage}>
              <svg className={styles.errorIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Email</label>
            <div className={styles.inputContainer}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <input 
                type="email"
                placeholder="seu@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.textInput}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Senha</label>
            <div className={styles.inputContainer}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <input 
                type="password" 
                placeholder="Sua senha" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className={styles.textInput}
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className={styles.loginButton}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner}></div>
                Entrando...
              </>
            ) : (
              'Entrar na conta'
            )}
          </button>

          <div className={styles.loginFooter}>
            <p className={styles.footerText}>
              Não tem uma conta?{' '}
              <span className={styles.footerLink}>
                Criar conta
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className={styles.backgroundElements}>
        <div className={styles.bubble1}></div>
        <div className={styles.bubble2}></div>
        <div className={styles.bubble3}></div>
      </div>
    </div>
  );
}