import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Sparkles,
    Send,
    Bot,
    User,
    CheckCircle2,
    AlertTriangle,
    Users,
    ArrowRight,
    Loader2,
    MessageSquare,
    Zap,
    X,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CopilotAction {
    type: string;
    id?: number;
    label: string;
    description: string;
    url?: string;
    method?: string;
    data?: Record<string, unknown>;
}

interface Message {
    id: string;
    sender: 'user' | 'assistant';
    content: string;
    actions?: CopilotAction[];
    timestamp: Date;
}

interface OrganizerCopilotProps {
    eventId: number;
    eventTitle: string;
    capacity?: number;
    registeredCount?: number;
    pendingCount?: number;
}

export function OrganizerCopilot({
    eventId,
    eventTitle,
    capacity,
    registeredCount,
    pendingCount = 0,
}: OrganizerCopilotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState<CopilotAction | null>(null);
    const [isExecutingAction, setIsExecutingAction] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        'Summarize pending applicants',
        'Capacity & seat status',
        'Are there any senior engineers or founders?',
        'Summarize attendee feedback',
        'Draft an announcement email',
    ];

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'init',
                    sender: 'assistant',
                    content: `👋 Hello! I am your live **MeetMind AI Copilot** for **${eventTitle}**.\n\nI have real-time access to your live attendee database, applications, capacity metrics, and feedback. How can I help you today?`,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [eventTitle]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (textToSend?: string) => {
        const queryText = (textToSend || inputValue).trim();
        if (!queryText || isLoading) return;

        const userMsg: Message = {
            id: `usr-${Date.now()}`,
            sender: 'user',
            content: queryText,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '';

            const res = await fetch(`/organizer/events/${eventId}/copilot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ message: queryText }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to communicate with AI Copilot.');
            }

            const data = await res.json();

            const assistantMsg: Message = {
                id: `ai-${Date.now()}`,
                sender: 'assistant',
                content: data.reply || 'No response generated.',
                actions: data.actions || [],
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    sender: 'assistant',
                    content: `⚠️ **Error communicating with Copilot:** ${errorMessage}`,
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteAction = () => {
        if (!pendingAction || !pendingAction.url) return;

        setIsExecutingAction(true);
        const url = pendingAction.url;
        const postData = pendingAction.data || {};

        router.post(url, postData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsExecutingAction(false);
                const executed = pendingAction;
                setPendingAction(null);

                // Add confirmation note to conversation
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `act-${Date.now()}`,
                        sender: 'assistant',
                        content: `✅ **Action Confirmed:** Successfully executed **${executed.label}**. The live attendee records and remaining capacity have been updated.`,
                        timestamp: new Date(),
                    },
                ]);
            },
            onError: (errors) => {
                setIsExecutingAction(false);
                setPendingAction(null);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        sender: 'assistant',
                        content: `❌ **Action Failed:** ${Object.values(errors).join(', ') || 'Could not complete request.'}`,
                        timestamp: new Date(),
                    },
                ]);
            },
        });
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 font-medium gap-2 border-none"
                    >
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span>AI Copilot</span>
                        {pendingCount > 0 && (
                            <Badge className="bg-white/20 text-white hover:bg-white/30 text-xs px-1.5 py-0 h-5">
                                {pendingCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>

                <SheetContent
                    side="right"
                    className="w-full sm:max-w-lg flex flex-col p-0 gap-0 border-l border-border bg-background"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-card/60 backdrop-blur">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-semibold leading-tight flex items-center gap-2">
                                    Organizer Copilot
                                    <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30 font-normal">
                                        Live Grounded
                                    </Badge>
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground truncate max-w-[320px]">
                                    {eventTitle}
                                </SheetDescription>
                            </div>
                        </div>

                        {/* Event Quick Stats Pill */}
                        {capacity !== undefined && registeredCount !== undefined && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                                <span>Capacity: <strong>{registeredCount} / {capacity}</strong></span>
                                <span>•</span>
                                <span>Remaining: <strong>{Math.max(0, capacity - registeredCount)}</strong></span>
                                <span>•</span>
                                <span>Pending: <strong className="text-amber-500">{pendingCount}</strong></span>
                            </div>
                        )}
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={`flex gap-3 text-sm ${
                                    m.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {m.sender === 'assistant' && (
                                    <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                                        m.sender === 'user'
                                            ? 'bg-primary text-primary-foreground font-medium rounded-br-none'
                                            : 'bg-card border border-border text-foreground rounded-bl-none shadow-sm'
                                    }`}
                                >
                                    <div className="whitespace-pre-wrap text-xs sm:text-sm">
                                        {m.content}
                                    </div>

                                    {/* Action Suggestions from Copilot */}
                                    {m.actions && m.actions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                <Zap className="h-3 w-3 text-amber-500" />
                                                Suggested Actions
                                            </p>
                                            <div className="space-y-1.5">
                                                {m.actions.map((act, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="p-2.5 rounded-lg bg-background/80 border border-border flex items-center justify-between gap-2"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-semibold text-xs text-foreground truncate">
                                                                {act.label}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground truncate">
                                                                {act.description}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1"
                                                            onClick={() => setPendingAction(act)}
                                                        >
                                                            <span>Review & Run</span>
                                                            <ArrowRight className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {m.sender === 'user' && (
                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                        <User className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 text-sm justify-start">
                                <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="bg-card border border-border rounded-2xl px-4 py-3 text-muted-foreground flex items-center gap-2 text-xs">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                                    <span>Analyzing live event records...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="px-4 py-2 border-t border-border/60 bg-card/30">
                        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSendMessage(prompt)}
                                    disabled={isLoading}
                                    className="whitespace-nowrap px-2.5 py-1 rounded-full border border-border/80 bg-background hover:bg-accent hover:text-accent-foreground text-xs text-muted-foreground transition-colors disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-border bg-card/60 backdrop-blur">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask copilot about applicants, seats, feedback..."
                                disabled={isLoading}
                                className="flex-1 bg-background text-foreground border border-input rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isLoading || !inputValue.trim()}
                                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 px-3"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Human-in-the-Loop Confirmation Dialog */}
            <Dialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            <span>Confirm Action Execution</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            The AI Copilot has proposed the following change to live event data:
                        </DialogDescription>
                    </DialogHeader>

                    {pendingAction && (
                        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm space-y-1">
                            <div className="font-semibold text-foreground">{pendingAction.label}</div>
                            <div className="text-xs text-muted-foreground">{pendingAction.description}</div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Actions directly modify attendee registration status, decrement available capacity, and issue signed cryptographic boarding passes.
                    </p>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setPendingAction(null)}
                            disabled={isExecutingAction}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            onClick={handleExecuteAction}
                            disabled={isExecutingAction}
                        >
                            {isExecutingAction ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Executing...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>Confirm & Execute</span>
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
