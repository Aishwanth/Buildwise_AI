
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Upload, Mic, StopCircle, Loader, Volume2 } from 'lucide-react';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: {
        type: 'image' | 'audio' | 'text';
        url: string;
        name: string;
    }[];
}

interface ChatBotProps {
    isOpen: boolean;
    onClose: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '0',
            role: 'assistant',
            content: 'Hello! 👋 I\'m BuildWise AI Assistant. I can help you with construction planning, project analysis, worker requirements, cost estimates, and much more. Feel free to ask me anything about your construction project!',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [attachments, setAttachments] = useState<ChatMessage['attachments']>([]);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recognitionActive, setRecognitionActive] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const finalTranscriptRef = useRef<string>('');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize Speech Recognition once
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition && !recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => {
                console.log('Speech recognition started');
                finalTranscriptRef.current = '';
                setRecognitionActive(true);
            };

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        finalTranscriptRef.current += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                // Update input with interim results for visual feedback
                const displayText = finalTranscriptRef.current + interimTranscript;
                setInputText(displayText.trim());
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech Recognition Error:', event.error);
                setRecognitionActive(false);

                if (event.error === 'no-speech') {
                    alert('⚠️ No speech detected. Please speak clearly and try again.');
                } else if (event.error === 'network') {
                    alert('⚠️ Network error. Please check your internet connection.');
                } else if (event.error === 'audio-capture') {
                    alert('⚠️ No microphone access. Please check microphone permissions.');
                }
            };

            recognitionRef.current.onend = () => {
                console.log('Speech recognition ended');
                setIsRecording(false);
                setRecognitionActive(false);

                // Set the final transcript to input
                if (finalTranscriptRef.current.trim()) {
                    setInputText(finalTranscriptRef.current.trim());
                }
            };
        }

        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        };
    }, []);

    const handleSendMessage = async () => {
        if (!inputText.trim() && attachments.length === 0) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date(),
            attachments: attachments.length > 0 ? attachments : undefined,
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setAttachments([]);
        setIsLoading(true);

        try {
            const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY;

            if (!geminiKey || geminiKey.includes('YOUR_API_KEY')) {
                throw new Error('API Key not configured');
            }

            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "You are BuildWise, an expert construction planning AI assistant. You provide helpful, accurate, and detailed answers about construction planning, labor management, cost estimation, and safety. Be conversational, friendly, and professional." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "I understand. I am BuildWise AI, your construction planning expert. How can I help you with your project today?" }],
                    },
                    ...messages.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }],
                    }))
                ],
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                },
            });

            // If there are attachments, we need to handle multimodal input
            let responseText = "";
            if (attachments.length > 0) {
                const parts = [{ text: inputText }];

                for (const att of attachments) {
                    if (att.type === 'image') {
                        parts.push({
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: att.url.split(',')[1] || att.url
                            }
                        } as any);
                    }
                }

                const result = await model.generateContent(parts);
                const response = await result.response;
                responseText = response.text();
            } else {
                const result = await chat.sendMessage(inputText);
                const response = await result.response;
                responseText = response.text();
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText || 'I apologize, but I could not generate a response. Please try again.',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);

            let errorContent = '';
            if (error instanceof Error && error.message === 'API Key not configured') {
                errorContent = `❌ **Gemini API Key Not Configured**

To enable the chatbot, you need to:

1. Get an API key from **Google AI Studio** (https://aistudio.google.com)
2. Set the key in your **.env.local** file:
   \`VITE_GEMINI_API_KEY=your_api_key_here\`
3. Restart the development server`;
            } else {
                errorContent = `❌ **Error Processing Request**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Please check:**
- Your internet connection
- Your Gemini API key is valid and active
- Try again in a few moments`;
            }

            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorContent,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.currentTarget.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const fileType = file.type.startsWith('image') ? 'image' :
                    file.type.startsWith('audio') ? 'audio' : 'text';

                const attachment = {
                    type: fileType as 'image' | 'audio' | 'text',
                    url: e.target?.result as string,
                    name: file.name,
                };

                setAttachments(prev => [...prev, attachment]);
            };

            if (file.type.startsWith('image') || file.type.startsWith('audio')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });

        event.currentTarget.value = '';
    };

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            try {
                finalTranscriptRef.current = '';
                setInputText('');
                recognitionRef.current.start();
                setIsRecording(true);
                setRecordingTime(0);

                recordingIntervalRef.current = setInterval(() => {
                    setRecordingTime(t => t + 1);
                }, 1000);
            } catch (error) {
                console.error('Error starting recording:', error);
                alert('Could not start recording. Please check your microphone permissions.');
            }
        } else if (!recognitionRef.current) {
            alert('🌐 Speech Recognition is not supported in your browser.\n\nPlease use:\n• Chrome\n• Firefox\n• Safari\n• Edge');
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            try {
                recognitionRef.current.stop();
                setIsRecording(false);

                if (recordingIntervalRef.current) {
                    clearInterval(recordingIntervalRef.current);
                    recordingIntervalRef.current = null;
                }
                setRecordingTime(0);
            } catch (error) {
                console.error('Error stopping recording:', error);
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-96 h-screen md:h-[680px] bg-white rounded-tl-3xl md:rounded-3xl shadow-2xl z-40 flex flex-col border border-slate-200 md:border-none md:m-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-tl-3xl md:rounded-t-3xl flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6" />
                    <div>
                        <h2 className="font-black text-lg">BuildWise AI</h2>
                        <p className="text-xs text-blue-100">✓ Voice enabled • Text & files</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs md:max-w-sm p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                : 'bg-slate-100 text-slate-800 rounded-bl-none shadow-sm border border-slate-200'
                                }`}
                        >
                            {/* Message attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    {msg.attachments.map((att, idx) => (
                                        <div key={idx} className="text-xs font-bold opacity-70">
                                            {att.type === 'image' && (
                                                <img
                                                    src={att.url}
                                                    alt={att.name}
                                                    className="rounded-lg max-w-xs max-h-40 border-2 border-white/30"
                                                />
                                            )}
                                            {att.type === 'audio' && (
                                                <div className="flex items-center gap-2 bg-white/20 p-2 rounded-lg">
                                                    <Volume2 className="w-4 h-4" />
                                                    <span>{att.name}</span>
                                                </div>
                                            )}
                                            {att.type === 'text' && (
                                                <div className="bg-white/20 p-2 rounded-lg">
                                                    📄 {att.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Message text */}
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                            </div>

                            {/* Timestamp */}
                            <p
                                className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200">
                            <div className="flex gap-2 items-center">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span className="text-sm font-medium">BuildWise is analyzing your question...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-100 max-h-24 overflow-y-auto flex-shrink-0">
                    <div className="flex gap-2 flex-wrap">
                        {attachments.map((att, idx) => (
                            <div key={idx} className="relative group">
                                {att.type === 'image' ? (
                                    <img
                                        src={att.url}
                                        alt={att.name}
                                        className="h-16 w-16 rounded-lg object-cover border-2 border-blue-500"
                                    />
                                ) : att.type === 'audio' ? (
                                    <div className="h-16 w-16 rounded-lg border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                                        <Volume2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="h-16 w-16 rounded-lg border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                                        <span className="text-xs font-bold text-blue-600">📄</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recording Status */}
            {isRecording && (
                <div className="px-4 py-3 bg-red-100 border-t border-red-200 flex items-center gap-3 flex-shrink-0">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-red-700 flex-1">
                        🎤 Listening... {formatTime(recordingTime)}
                    </span>
                    <button
                        onClick={stopRecording}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all"
                    >
                        Stop
                    </button>
                </div>
            )}

            {/* Input Area */}
            <div className="border-t border-slate-200 p-4 space-y-3 bg-white flex-shrink-0">
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-all hover:scale-110"
                        title="Upload file (image, document, audio)"
                        disabled={isRecording || isLoading}
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,audio/*,.pdf,.txt,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                    />

                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2.5 rounded-lg transition-all flex items-center gap-2 hover:scale-110 ${isRecording
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'hover:bg-blue-100 text-blue-600'
                            }`}
                        disabled={isLoading}
                        title={isRecording ? 'Stop recording' : 'Start voice recording (speak clearly)'}
                    >
                        {isRecording ? (
                            <StopCircle className="w-5 h-5" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Text Input */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && !isRecording && handleSendMessage()}
                        placeholder={isRecording ? 'Recording... Speak now' : 'Ask me anything about construction...'}
                        disabled={isLoading || isRecording}
                        className="flex-1 px-4 py-3 bg-slate-100 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-medium text-sm disabled:opacity-50 disabled:bg-slate-200"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || isRecording || (!inputText.trim() && attachments.length === 0)}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        title="Send message"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                    💬 Type, 🎤 speak, or 📎 attach • Press Enter to send
                </p>
            </div>
        </div>
    );
};

export default ChatBot;
