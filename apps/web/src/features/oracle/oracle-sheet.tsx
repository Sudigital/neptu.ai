import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { neptuApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

type OracleMessage = {
  id: string;
  sender: "You" | "Oracle";
  message: string;
  timestamp: Date;
};

interface OracleSheetProps {
  children?: ReactNode;
}

export function OracleSheet({ children }: OracleSheetProps) {
  const { user } = useUser();
  const { language } = useSettingsStore();
  const t = useTranslate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<OracleMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const birthDate = user?.birthDate;
  const interests = user?.interests || [];

  // Handle sheet open change - reset messages with welcome
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setMessages([
        {
          id: "welcome",
          sender: "Oracle",
          message: birthDate
            ? `${t("oracle.welcome")} ${t("oracle.askQuestion")}`
            : t("oracle.setBirthDate"),
          timestamp: new Date(),
        },
      ]);
      setInput("");
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  // Ask Oracle mutation - always include today's date for Peluang context
  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      if (!birthDate) {
        throw new Error("Please set your birth date first");
      }
      // Include user interests in the question context
      const contextualQuestion =
        interests.length > 0
          ? `[User interests: ${interests.join(", ")}] ${question}`
          : question;
      const today = new Date().toISOString().split("T")[0];
      return neptuApi.askOracle(contextualQuestion, birthDate, today, language);
    },
    onSuccess: (data) => {
      const oracleResponse: OracleMessage = {
        id: `oracle-${Date.now()}`,
        sender: "Oracle",
        message: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, oracleResponse]);
    },
    onError: (error) => {
      const errorMessage: OracleMessage = {
        id: `error-${Date.now()}`,
        sender: "Oracle",
        message:
          error instanceof Error
            ? `I apologize, I couldn't process that: ${error.message}`
            : "I apologize, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || askMutation.isPending) return;

    // Add user message
    const userMessage: OracleMessage = {
      id: `user-${Date.now()}`,
      sender: "You",
      message: trimmedInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Ask the oracle
    askMutation.mutate(trimmedInput);
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc: Record<string, OracleMessage[]>, msg) => {
      const key = format(msg.timestamp, "d MMM, yyyy");
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      return acc;
    },
    {}
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="relative">
            <Bot className="h-5 w-5" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-dvh max-h-dvh w-full flex-col gap-0 p-0 sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary/10">
              <AvatarFallback>
                <Bot className="h-5 w-5 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base">{t("oracle.title")}</SheetTitle>
              <SheetDescription className="text-xs">
                {t("oracle.subtitle", "Your personal Balinese astrology guide")}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Chat messages */}
        <div
          ref={scrollRef}
          className="-webkit-overflow-scrolling-touch min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex flex-col gap-4">
            {Object.keys(groupedMessages).map((dateKey) => (
              <Fragment key={dateKey}>
                <div className="text-center text-xs text-muted-foreground">
                  {dateKey}
                </div>
                {groupedMessages[dateKey].map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words",
                      msg.sender === "You"
                        ? "self-end rounded-br-none bg-primary text-primary-foreground"
                        : "self-start rounded-bl-none bg-muted"
                    )}
                  >
                    {msg.message}
                    <span
                      className={cn(
                        "mt-1 block text-xs opacity-70",
                        msg.sender === "You" && "text-end"
                      )}
                    >
                      {format(msg.timestamp, "h:mm a")}
                    </span>
                  </div>
                ))}
              </Fragment>
            ))}
            {askMutation.isPending && (
              <div className="self-start rounded-2xl rounded-bl-none bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Input form */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              birthDate
                ? t("oracle.placeholder")
                : t(
                    "oracle.setBirthDateShort",
                    "Set your birth date to chat..."
                  )
            }
            disabled={!birthDate || askMutation.isPending}
            className="h-10 flex-1 rounded-md bg-muted px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!birthDate || !input.trim() || askMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
