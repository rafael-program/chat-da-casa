"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);

      const channel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages' 
          }, 
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const cleanupPromise = initializeChat();
    
    return () => {
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [initializeChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || !userId) return;

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('messages')
        .insert({ 
          content: trimmedMessage, 
          user_id: userId 
        });

      if (error) throw error;
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#111b21] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#8696a0] font-medium">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#111b21] flex flex-col">
      {/* Header */}
      <div className="bg-[#202c33] px-6 py-4 flex justify-between items-center border-b border-[#2a3942]">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-xl">Assuntos Internos</h1>
            <p className="text-[#8696a0] text-sm mt-1">Online</p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-[#00a884] hover:bg-[#06cf91] text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Sair
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto bg-[#0b141a] bg-chat-pattern bg-cover bg-center p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
            <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.user_id === userId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                      isMe
                        ? 'bg-[#005c4b] text-white rounded-br-none'
                        : 'bg-[#202c33] text-white rounded-bl-none'
                    }`}
                  >
                    <div className="text-[15px] leading-relaxed break-words">
                      {msg.content}
                    </div>
                    <div className={`text-xs mt-2 text-right ${isMe ? 'text-[#8696a0]' : 'text-[#8696a0]'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {isMe && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-[#202c33] p-4 border-t border-[#2a3942]">
        <div className="flex items-center space-x-3">
          <button className="text-[#8696a0] hover:text-white p-3 rounded-full hover:bg-[#2a3942] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-4-7h8a4 4 0 0 1-8 0z"/>
            </svg>
          </button>
          
          <button className="text-[#8696a0] hover:text-white p-3 rounded-full hover:bg-[#2a3942] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.586 10.461l-7.047-7.047a4.001 4.001 0 0 0-5.66 0l-7.047 7.047a4.001 4.001 0 0 0 5.66 5.66l5.756-5.756 5.756 5.756a4.001 4.001 0 0 0 5.66-5.66z"/>
            </svg>
          </button>

          <div className="flex-1 bg-[#2a3942] rounded-2xl">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              disabled={isSending}
              className="w-full bg-transparent border-none outline-none px-4 py-3 text-white placeholder-[#8696a0] text-[15px]"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all duration-200 ${
              newMessage.trim() 
                ? 'bg-[#00a884] hover:bg-[#06cf91] text-white' 
                : 'text-[#8696a0] hover:text-white hover:bg-[#2a3942]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {newMessage.trim() ? (
              isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
            )}
          </button>
        </div>
        
        <p className="text-xs text-[#8696a0] text-center mt-3">
          As mensagens são sincronizadas em tempo real - {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <style jsx>{`
        .bg-chat-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23121d24' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}