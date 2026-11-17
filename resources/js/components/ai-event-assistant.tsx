import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, User, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Event } from '@/types';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    time: string;
};

type Props = {
    event: Event;
};

export function AiEventAssistant({ event }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: `Hello! I'm your grounded AI assistant for **${event.title}**. Ask me about the agenda, venue location, parking, registration rules, or tickets!`,
            time: 'Just now',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

            const res = await fetch(`/events/${event.slug}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message: textToSend.trim(),
                    session_id: sessionId,
                }),
            });

            const data = await res.json();

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "I don't have that detail in the published schedule. Please contact the host.",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Sorry, I encountered a temporary connection issue. Please ask again in a moment.",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const promptChips = [
        'What is the schedule?',
        'Where is the venue & parking?',
        'How do I check in with my ticket?',
        'Who is organizing this event?',
    ];

    return (
        <>
            {/* Floating Trigger Pill */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className="h-13 px-5 rounded-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-xl shadow-amber-500/25 flex items-center gap-2.5 transition-transform hover:scale-105"
                >
                    <Bot className="h-5 w-5" />
                    <span className="hidden sm:inline">Ask AI Assistant</span>
                    <Sparkles className="h-3.5 w-3.5 opacity-80" />
                </Button>
            </div>

            {/* Chat Modal / Flyout Drawer */}
            {isOpen && (
                <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[95vw] sm:w-[440px] h-[580px] max-h-[80vh] rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                    {/* Drawer Header */}
                    <div className="p-4 px-5 border-b border-border/40 bg-neutral-900/90 backdrop-blur flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    MeetMind Assistant
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-mono">
                                        GROUNDED
                                    </span>
                                </h3>
                                <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                                    {event.title}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center hover:bg-muted"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Grounding Notice */}
                    <div className="px-4 py-2 bg-muted/30 border-b border-border/30 text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">Trained on official schedule, location, and FAQ data.</span>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <Bot className="h-3.5 w-3.5" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-amber-500 text-neutral-950 font-medium rounded-tr-xs'
                                            : 'bg-muted/50 text-foreground border border-border/40 rounded-tl-xs'
                                    }`}
                                >
                                    <div className="whitespace-pre-line">{msg.content}</div>
                                    <div
                                        className={`mt-1 text-[10px] ${
                                            msg.role === 'user' ? 'text-neutral-950/70 text-right' : 'text-muted-foreground'
                                        }`}
                                    >
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5 justify-start">
                                <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                    <Bot className="h-3.5 w-3.5" />
                                </div>
                                <div className="bg-muted/50 rounded-2xl rounded-tl-xs p-3 border border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                    <span>Retrieving event data...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Prompt Chips */}
                    <div className="p-2 px-4 border-t border-border/30 bg-muted/10 overflow-x-auto flex gap-1.5 whitespace-nowrap">
                        {promptChips.map((chip, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSend(chip)}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40 transition-colors"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Input Field */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="p-3 border-t border-border/40 bg-card flex gap-2"
                    >
                        <Input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask any question about this event..."
                            className="h-10 text-xs shadow-none border-border/60"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || loading}
                            className="h-10 w-10 shrink-0 bg-amber-500 hover:bg-amber-600 text-neutral-950"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            )}
        </>
    );
}
