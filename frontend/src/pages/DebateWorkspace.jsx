import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logoutUser } from "../services/auth";
import {
  generateNextTurn,
  getDebateSession,
  postUserMessage,
  updateDebateMode,
} from "../services/debate";
import DiscussionPanel from "../components/workspace/DiscussionPanel";
import WhiteboardPanel from "../components/workspace/WhiteboardPanel";
import WorkspaceHeader from "../components/workspace/WorkspaceHeader";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";

export default function DebateWorkspace() {
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoPauseRequested, setAutoPauseRequested] = useState(false);
  const autoRunRef = useRef(false);

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
        queryKey: ["debateSession", sessionId],
      }),
  });

  const sendMutation = useMutation({
    mutationFn: (content) => postUserMessage(sessionId, content),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["debateSession", sessionId],
      });

      generateMutation.mutate();
    },
  });

  const canSendMessage =
    session?.status === "active" && !generateMutation.isPending && !autoRunning;

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

  useEffect(() => {
    return () => {
      autoRunRef.current = false;
    };
  }, []);
  const startAutoRun = async () => {
    if (autoRunRef.current || session?.mode !== "auto") return;

    const expertTurns = messages.filter(
      (message) => message.speakerType === "expert",
    ).length;
    const turnLimit = session.argumentLimit ?? 10;
    const turnsRemaining = Math.max(0, turnLimit - expertTurns);

    if (turnsRemaining === 0) {
      await sessionQuery.refetch();
      return;
    }

    autoRunRef.current = true;
    setAutoRunning(true);
    setAutoPauseRequested(false);

    try {
      for (
        let turn = 0;
        turn < turnsRemaining && autoRunRef.current;
        turn += 1
      ) {
        const result = await generateMutation.mutateAsync();

       if (result?.completed || result?.autoStopped || result?.mode === 'manual') {
  break
}
      }
    } catch {
      // The generation mutation exposes the error to the discussion panel.
    } finally {
      autoRunRef.current = false;
      setAutoRunning(false);
      setAutoPauseRequested(false);
    }
  };

  const pauseAutoRun = () => {
    autoRunRef.current = false;
    setAutoPauseRequested(true);
  };
  const canRunAuto =
    session?.mode === "auto" &&
    !["completed", "abandoned"].includes(session?.status);

  const modeMutation = useMutation({
    mutationFn: ({ mode, argumentLimit }) =>
      updateDebateMode(sessionId, mode, argumentLimit),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["debateSession", sessionId], (current) =>
        current ? { ...current, session: updatedSession } : current,
      );
    },
  });
  const canChangeMode =
  session?.status === 'active' &&
  !generateMutation.isPending &&
  !sendMutation.isPending &&
  !autoRunning &&
  !modeMutation.isPending
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
          topic={topic}
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
            canSendMessage={canSendMessage && !modeMutation.isPending}
            sessionStatus={session?.status}
            onSendMessage={(content, onSuccess) =>
              sendMutation.mutate(content, { onSuccess })
            }
            sessionMode={session?.mode || "manual"}
            canRunAuto={canRunAuto}
            autoRunning={autoRunning}
            autoPauseRequested={autoPauseRequested}
            onStartAuto={startAutoRun}
            onPauseAuto={pauseAutoRun}
            isSending={sendMutation.isPending}
            sendError={sendMutation.error}
          
sessionArgumentLimit={session?.argumentLimit}
expertTurnCount={messages.filter(
  message => message.speakerType === 'expert',
).length}
canChangeMode={canChangeMode}
isModeChangePending={modeMutation.isPending}
modeChangeError={modeMutation.error}
onChangeMode={(mode, argumentLimit, onSuccess) =>
  modeMutation.mutate({ mode, argumentLimit }, { onSuccess })
}
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
