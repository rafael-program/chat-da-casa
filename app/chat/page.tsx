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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
    // Scroll suave apenas se o usuário já estiver perto do final
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
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
      <div className="w-full h-screen bg-gradient-to-br from-[#111b21] to-[#0d1519] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-[#00a884]/20 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-[#8696a0] font-medium text-lg">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-[#111b21] to-[#0d1519] flex flex-col">
      {/* Header */}
      <div className="bg-[#202c33] px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-[#2a3942] shadow-lg">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="relative">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#00a884] to-[#06cf91] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg md:text-xl">C</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]"></div>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg md:text-xl">Assuntos Internos</h1>
            <p className="text-[#8696a0] text-xs md:text-sm mt-0.5 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="bg-gradient-to-r from-[#00a884] to-[#06cf91] hover:from-[#06cf91] hover:to-[#00a884] text-white px-4 py-2 md:px-6 md:py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <span className="hidden md:inline">Sair</span>
          <svg className="md:hidden w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-[#0b141a] bg-chat-pattern bg-cover bg-center p-4 md:p-6 transition-all duration-300"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0] animate-fade-in">
            <div className="text-7xl mb-6 opacity-80">💬</div>
            <p className="text-xl font-medium mb-2">Nenhuma mensagem ainda</p>
            <p className="text-sm text-center max-w-md">Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isMe = msg.user_id === userId;
              const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2 chat-message`}
                >
                  {!isMe && showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00a884] to-[#06cf91] rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {msg.user_id.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 ${
                      isMe
                        ? 'bg-gradient-to-br from-[#005c4b] to-[#008170] text-white rounded-br-md'
                        : 'bg-[#202c33] text-white rounded-bl-md'
                    } ${showAvatar && !isMe ? 'ml-10' : ''}`}
                  >
                    <div className="text-[15px] leading-relaxed break-words">
                      {msg.content}
                    </div>
                    <div className={`text-xs mt-2 flex items-center justify-end space-x-1 ${isMe ? 'text-[#8696a0]' : 'text-[#8696a0]'}`}>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMe && (
                        <span className="text-blue-300">✓✓</span>
                      )}
                    </div>
                  </div>
                  
                  {isMe && showAvatar && (
                    <div className="w-8 h-8 bg-gradient-to-br from-[#00a884] to-[#06cf91] rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      Você
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} className="h-4" />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-[#202c33] p-4 border-t border-[#2a3942] shadow-lg">
        <div className="flex items-center space-x-2 md:space-x-3">
          <button className="text-[#8696a0] hover:text-white p-2 md:p-3 rounded-full hover:bg-[#2a3942] transition-all duration-200 transform hover:scale-110 active:scale-95">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-4-7h8a4 4 0 0 1-8 0z"/>
            </svg>
          </button>
          
          <button className="text-[#8696a0] hover:text-white p-2 md:p-3 rounded-full hover:bg-[#2a3942] transition-all duration-200 transform hover:scale-110 active:scale-95">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.586 10.461l-7.047-7.047a4.001 4.001 0 0 0-5.66 0l-7.047 7.047a4.001 4.001 0 0 0 5.66 5.66l5.756-5.756 5.756 5.756a4.001 4.001 0 0 0 5.66-5.66z"/>
            </svg>
          </button>

          <div className="flex-1 bg-[#2a3942] rounded-2xl transition-all duration-200 focus-within:ring-2 focus-within:ring-[#00a884]/50 focus-within:bg-[#2d3b43]">
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
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${
              newMessage.trim() 
                ? 'bg-gradient-to-r from-[#00a884] to-[#06cf91] hover:from-[#06cf91] hover:to-[#00a884] text-white shadow-lg' 
                : 'text-[#8696a0] hover:text-white hover:bg-[#2a3942]'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {newMessage.trim() ? (
              isSending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
            )}
          </button>
        </div>
        
        <p className="text-xs text-[#8696a0] text-center mt-3 animate-pulse">
          As mensagens são sincronizadas em tempo real • {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <style jsx>{`
        .bg-chat-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23121d24' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
        }
        
        .chat-message {
          animation: fadeInUp 0.3s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}