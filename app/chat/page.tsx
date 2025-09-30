"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";
import styles from "./ChatPage.module.css";

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
      <div className={styles.chatLoadingContainer}>
        <div className={styles.chatLoadingContent}>
          <div className={styles.chatLoadingSpinner}>
            <div className={styles.chatLoadingSpinnerBackground}></div>
            <div className={styles.chatLoadingSpinnerForeground}></div>
          </div>
          <p className={styles.chatLoadingText}>Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatModernContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <div className={styles.chatAvatarContainer}>
            <div className={styles.chatAvatar}>
              <span className={styles.chatAvatarText}>C</span>
            </div>
            <div className={styles.chatOnlineIndicator}></div>
          </div>
          <div className={styles.chatHeaderText}>
            <h1 className={styles.chatTitle}>Assuntos Internos</h1>
            <p className={styles.chatStatus}>
              <span className={styles.chatStatusIndicator}></span>
              Online
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className={styles.chatLogoutBtn}
        >
          <span className={styles.chatLogoutText}>Sair</span>
          <svg className={styles.chatLogoutIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Área de Mensagens */}
      <div 
        ref={messagesContainerRef}
        className={styles.chatMessagesContainer}
      >
        {messages.length === 0 ? (
          <div className={styles.chatEmptyState}>
            <div className={styles.chatEmptyIcon}>💬</div>
            <p className={styles.chatEmptyTitle}>Nenhuma mensagem ainda</p>
            <p className={styles.chatEmptySubtitle}>Envie uma mensagem para iniciar a conversa</p>
          </div>
        ) : (
          <div className={styles.chatMessagesList}>
            {messages.map((msg, index) => {
              const isMe = msg.user_id === userId;
              const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;
              
              return (
                <div
                  key={msg.id}
                  className={`${styles.chatMessage} ${isMe ? styles.chatMessageSent : styles.chatMessageReceived}`}
                >
                  {!isMe && showAvatar && (
                    <div className={styles.chatMessageAvatar}>
                      {msg.user_id.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={styles.chatMessageContent}>
                    {showAvatar && (
                      <div className={styles.chatMessageSender}>
                        {isMe ? 'Você' : msg.user_id.slice(0, 6)}
                      </div>
                    )}
                    <div
                      className={`${styles.chatMessageBubble} ${isMe ? styles.chatMessageBubbleSent : styles.chatMessageBubbleReceived} ${
                        showAvatar && !isMe ? styles.chatMessageBubbleWithAvatar : ''
                      }`}
                    >
                      <div className={styles.chatMessageText}>
                        {msg.content}
                      </div>
                      <div className={styles.chatMessageTime}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {isMe && (
                          <span className={styles.chatMessageStatus}>✓✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isMe && showAvatar && (
                    <div className={`${styles.chatMessageAvatar} ${styles.chatMessageAvatarYou}`}>
                      Você
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div ref={chatEndRef} className={styles.chatScrollAnchor} />
      </div>

      {/* Input de Mensagem */}
      <div className={styles.chatInputContainer}>
        <div className={styles.chatInputWrapper}>
          <button className={styles.chatActionBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-4-7h8a4 4 0 0 1-8 0z"/>
            </svg>
          </button>
          
          <button className={styles.chatActionBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.586 10.461l-7.047-7.047a4.001 4.001 0 0 0-5.66 0l-7.047 7.047a4.001 4.001 0 0 0 5.66 5.66l5.756-5.756 5.756 5.756a4.001 4.001 0 0 0 5.66-5.66z"/>
            </svg>
          </button>

          <div className={styles.chatInputField}>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              disabled={isSending}
              className={styles.chatTextInput}
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className={`${styles.chatSendBtn} ${newMessage.trim() ? styles.chatSendBtnActive : ''}`}
          >
            {newMessage.trim() ? (
              isSending ? (
                <div className={styles.chatSendSpinner} />
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
        
        <p className={styles.chatFooter}>
          As mensagens são sincronizadas em tempo real • {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}