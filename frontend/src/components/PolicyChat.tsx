'use client'

import { useState, useEffect, useRef } from 'react'
import { ulid } from 'ulid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
}

interface PolicyChatProps {
  queryId: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export default function PolicyChat({ queryId }: PolicyChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isChatAvailable, setIsChatAvailable] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize session on mount
  useEffect(() => {
    const storageKey = `policy_chat_session_${queryId}`
    let stored = localStorage.getItem(storageKey)

    if (!stored) {
      stored = ulid()
      localStorage.setItem(storageKey, stored)
    }

    setSessionId(stored)
    checkChatAvailability()
    loadChatHistory(stored)
  }, [queryId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkChatAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/queries/${queryId}/chat/health`)
      const data = await response.json()
      setIsChatAvailable(data.available)
    } catch (error) {
      console.error('Failed to check chat availability:', error)
      setIsChatAvailable(false)
    }
  }

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/queries/${queryId}/chat/${sid}/history`)
      const data = await response.json()

      const loadedMessages: Message[] = []
      data.history.forEach((turn: any) => {
        loadedMessages.push({
          id: turn.messageId + '_user',
          role: 'user',
          content: turn.userMessage,
          timestamp: turn.timestamp
        })
        loadedMessages.push({
          id: turn.messageId,
          role: 'assistant',
          content: turn.assistantResponse,
          timestamp: turn.timestamp
        })
      })

      setMessages(loadedMessages)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: ulid(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    const assistantMessage: Message = {
      id: ulid(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/queries/${queryId}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          message: userMessage.content
        })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.error) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMessage.id
                  ? { ...m, content: 'Error: ' + data.error, isStreaming: false }
                  : m
              ))
              break
            }

            if (data.chunk) {
              accumulatedText += data.chunk
              setMessages(prev => prev.map(m =>
                m.id === assistantMessage.id
                  ? { ...m, content: accumulatedText }
                  : m
              ))
            }

            if (data.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantMessage.id
                  ? { ...m, isStreaming: false }
                  : m
              ))
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: 'Failed to get response. Please try again.', isStreaming: false }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isChatAvailable === null) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (isChatAvailable === false) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-neutral-400">
        <ChatUnavailableIcon />
        <p className="mt-4 text-sm">Chat is not available for this policy yet</p>
        <p className="text-xs text-neutral-500 mt-2">Please wait for policy analysis to complete</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-dark-500/30 border border-dark-300/40 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-300/40 bg-dark-400/20">
        <div className="flex items-center gap-3">
          <ChatIcon />
          <div>
            <h3 className="text-sm font-medium text-neutral-200">Policy Assistant</h3>
            <p className="text-xs text-neutral-400">Ask questions about this policy</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-300/40 bg-dark-400/10">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this policy..."
            disabled={isLoading}
            rows={1}
            className="flex-1 px-4 py-3 bg-dark-400/30 border border-dark-300/40 rounded-lg
                     text-neutral-200 placeholder-neutral-500 text-sm
                     focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30
                     disabled:opacity-50 disabled:cursor-not-allowed
                     resize-none transition-all duration-200"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-primary-600 text-white rounded-lg
                     hover:bg-primary-500 active:bg-primary-700
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-all duration-200 flex items-center gap-2
                     font-medium text-sm"
          >
            {isLoading ? <LoadingDots /> : <SendIcon />}
          </button>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                      ${isUser ? 'bg-primary-600/20' : 'bg-dark-300/40'}`}>
          {isUser ? <UserIcon /> : <AssistantIcon />}
        </div>

        {/* Message Content */}
        <div className={`px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary-600/20 border border-primary-500/30'
            : 'bg-dark-400/40 border border-dark-300/40'
        }`}>
          {isUser ? (
            <p className="text-sm text-neutral-100 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm text-neutral-200 prose prose-invert prose-sm max-w-none
                          prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1
                          prose-headings:text-neutral-100 prose-headings:font-medium
                          prose-code:text-primary-300 prose-code:bg-dark-300/40 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
              {message.isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-full bg-primary-600/10 flex items-center justify-center mb-4">
        <ChatIcon className="w-8 h-8 text-primary-500" />
      </div>
      <h4 className="text-neutral-200 font-medium mb-2">Start a Conversation</h4>
      <p className="text-neutral-400 text-sm max-w-sm">
        Ask questions about the policy documents and get instant answers based on the analysis
      </p>
    </div>
  )
}

// Icons and Animations
function ChatIcon({ className = "w-5 h-5 text-primary-500" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function AssistantIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
}

function ChatUnavailableIcon() {
  return (
    <svg className="w-12 h-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function StreamingCursor() {
  return (
    <span className="inline-block w-1.5 h-4 bg-primary-500 ml-1 animate-pulse" />
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="w-8 h-8 border-3 border-primary-600/30 border-t-primary-500 rounded-full animate-spin" />
  )
}
