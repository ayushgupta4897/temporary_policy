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

interface FloatingDSMChatProps {
  queryId: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export default function FloatingDSMChat({ queryId }: FloatingDSMChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isChatAvailable, setIsChatAvailable] = useState<boolean | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiBasePath = `/api/dsm/${queryId}/chat`

  useEffect(() => {
    const storageKey = `dsm_chat_session_${queryId}`
    let stored = localStorage.getItem(storageKey)

    if (!stored) {
      stored = ulid()
      localStorage.setItem(storageKey, stored)
    }

    setSessionId(stored)
    checkChatAvailability()
  }, [queryId])

  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      loadChatHistory(sessionId)
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const checkChatAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${apiBasePath}/health`)
      const data = await response.json()
      setIsChatAvailable(data.available)
    } catch (error) {
      console.error('Failed to check chat availability:', error)
      setIsChatAvailable(false)
    }
  }

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${apiBasePath}/${sid}/history`)
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
      const response = await fetch(`${API_BASE_URL}${apiBasePath}/stream`, {
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

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true)
      setIsMinimized(false)
    } else {
      setIsOpen(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (isChatAvailable === false) return null

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-600 hover:bg-purple-500
                   text-white rounded-full shadow-lg hover:shadow-xl
                   flex items-center justify-center transition-all duration-300
                   hover:scale-110 active:scale-95"
          aria-label="Open DSM Chat"
          title="Systems Modeler Assistant"
        >
          <ChatBubbleIcon />
        </button>
      )}

      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-96 bg-dark-500 border border-dark-300/60
                       rounded-lg shadow-2xl transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[600px]'
        }`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-300/40
                        bg-dark-400/40 rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-neutral-200">Systems Modeler</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-dark-300/40 rounded transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <MaximizeIcon /> : <MinimizeIcon />}
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-dark-300/40 rounded transition-colors"
                aria-label="Close chat"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-600/10 flex items-center justify-center mb-3">
                      <ChatBubbleIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-neutral-300 text-sm font-medium mb-1">Systems Modeler</p>
                    <p className="text-neutral-500 text-xs">Ask about interventions & delta</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="p-3 border-t border-dark-300/40 bg-dark-400/20">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the model..."
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 px-3 py-2 bg-dark-400/40 border border-dark-300/40 rounded-lg
                             text-neutral-200 placeholder-neutral-500 text-sm
                             focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30
                             disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg
                             hover:bg-purple-500 active:bg-purple-700
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors flex items-center justify-center"
                  >
                    {isLoading ? <LoadingDots /> : <SendIcon />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
        isUser
          ? 'bg-purple-600/20 border border-purple-500/30 text-neutral-100'
          : 'bg-dark-400/60 border border-dark-300/40 text-neutral-200'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-sm prose-p:my-1 prose-headings:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
            {message.isStreaming && <span className="inline-block w-1 h-3 bg-purple-500 ml-0.5 animate-pulse" />}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatBubbleIcon({ className = "w-6 h-6" }: { className?: string }) {
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

function CloseIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg className="w-4 h-4 text-neutral-400 hover:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-0.5">
      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
