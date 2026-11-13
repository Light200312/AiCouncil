import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logoutUser } from "../services/auth";
import {
  generateNextTurn,
  getDebateSession,
  postUserMessage,
} from "../services/debate";
import DiscussionPanel from "../components/workspace/DiscussionPanel";
import WhiteboardPanel from "../components/workspace/WhiteboardPanel";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";

export default function DebateWorkspace() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const sessionQuery = useQuery({
    queryKey: ["debateSession", sessionId],
    queryFn: () => getDebateSession(sessionId),
    enabled: Boolean(sessionId),
  });
  const session = sessionQuery.data?.session;
  const messages = sessionQuery.data?.messages || [];
  const council = session?.council || [];

  const [collapsed, setCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showWhiteboard, setShowWhiteboard] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

const generateMutation = useMutation({
  mutationFn: () => generateNextTurn(sessionId),
  onSettled: () =>
    queryClient.invalidateQueries({
      queryKey: ['debateSession', sessionId],
    }),
})

const sendMutation = useMutation({
  mutationFn: content => postUserMessage(sessionId, content),

  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['debateSession', sessionId],
    })

    generateMutation.mutate()
  },
})


  const canSendMessage =
    session?.status === "active" && !generateMutation.isPending;

  const topic = session?.topic || session?.title || "Your council discussion";
  const mode = session?.mode?.replace("_", " ") || "manual";
  const sessionNumber = sessionId ? sessionId.slice(-4).toUpperCase() : "NEW";
  const displayName = user?.name || user?.username || "Your profile";
  const visibleMessages =
    activeFilter === "All"
      ? messages
      : messages.filter(
          (message) =>
            message.speakerType === "expert" &&
            message.speakerRef === activeFilter,
        );
  const canGenerateNextTurn =
    session?.mode === "manual" &&
    Boolean(session) &&
    !["completed", "abandoned"].includes(session?.status) &&
    !sendMutation.isPending;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      navigate("/login", { replace: true });
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-[600px] overflow-hidden bg-app text-text-primary">
      <WorkspaceSidebar
        collapsed={collapsed}
        userName={displayName}
        loggingOut={loggingOut}
        onNavigate={navigate}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          collapsed={collapsed}
          session={session}
          sessionNumber={sessionNumber}
          mode={mode}
          councilCount={council.length}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />

        <div className="flex min-h-0 flex-1 gap-3 p-3 lg:gap-4 lg:p-4">
          <DiscussionPanel
            topic={topic}
            council={council}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            canGenerateNextTurn={canGenerateNextTurn}
            onGenerateNextTurn={() => generateMutation.mutate()}
            isGenerating={generateMutation.isPending}
            generationError={generateMutation.error}
            sessionQuery={sessionQuery}
            messages={messages}
            visibleMessages={visibleMessages}
            formatTimestamp={formatTimestamp}
            canSendMessage={canSendMessage}
            sessionStatus={session?.status}
            onSendMessage={(content, onSuccess) =>
              sendMutation.mutate(content, { onSuccess })
            }
            isSending={sendMutation.isPending}
            sendError={sendMutation.error}
          />
          <WhiteboardPanel
            visible={showWhiteboard}
            onHide={() => setShowWhiteboard(false)}
            onShow={() => setShowWhiteboard(true)}
          />
        </div>
      </section>
    </div>
  );
}
