import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Terminal, X } from "lucide-react";
import Button from "./Button";
import { readTheme, saveTheme, themes } from "../utils/theme";

const sortedThemes = [...themes].sort((a, b) => a.label.localeCompare(b.label));

const help = [
  "theme list",
  "theme current",
  "theme set <id>",
  "clear",
].join("\n");

type TerminalOutput = string | { activeTheme: ReturnType<typeof readTheme> };

export default function ThemeTerminal() {
  const [theme, setTheme] = useState(readTheme);
  const [history, setHistory] = useState<{ command: string; output: TerminalOutput }[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const prompt = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const commandHistory = useRef({ entries: [] as string[], position: 0, draft: "" });
  const dialogId = useId();
  const titleId = useId();

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [history]);

  function handlePromptKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    const input = event.currentTarget;
    if (event.key === "Enter") {
      event.preventDefault();
      input.form?.requestSubmit();
      return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    const navigation = commandHistory.current;
    const end = navigation.entries.length;
    const offset = event.key === "ArrowUp" ? -1 : 1;
    const next = Math.max(0, Math.min(end, navigation.position + offset));

    event.preventDefault();
    if (next === navigation.position) return;
    if (navigation.position === end) navigation.draft = input.value;

    navigation.position = next;
    input.value = next === end ? navigation.draft : navigation.entries[next];
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function runCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = prompt.current;
    if (!input) return;

    const command = input.value.trim();
    if (!command) return;

    const navigation = commandHistory.current;
    navigation.entries.push(command);
    navigation.position = navigation.entries.length;
    navigation.draft = "";

    input.value = "";
    input.focus();
    const normalized = command.toLowerCase().replace(/\s+/g, " ");
    let output: TerminalOutput;

    switch (normalized) {
      case "clear":
        setHistory([]);
        return;
      case "help":
        output = help;
        break;
      case "theme list":
        output = { activeTheme: theme };
        break;
      case "theme current":
        output = `Active theme: ${theme}`;
        break;
      case "theme set":
        output = "Usage: theme set <id>";
        break;
      default: {
        if (!normalized.startsWith("theme set ")) {
          output = "Unknown command. Type help for available commands.";
          break;
        }
        const selected = themes.find(({ id }) => id === normalized.slice("theme set ".length));
        if (!selected) {
          output = "Unknown theme. Type theme list for available IDs.";
          break;
        }
        saveTheme(selected.id);
        setTheme(selected.id);
        output = `Theme set to ${selected.label}.`;
      }
    }

    setHistory((entries) => [...entries, { command, output }]);
  }

  return (
    <>
      <Button
        variant="icon"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-30 bg-elevated"
        aria-label="Open theme terminal"
        aria-haspopup="dialog"
        aria-controls={dialogId}
        title="Theme terminal"
        onClick={() => {
          dialog.current?.show();
          prompt.current?.focus();
        }}
      >
        <Terminal size={17} strokeWidth={1.5} aria-hidden="true" />
      </Button>

      <dialog
        ref={dialog}
        id={dialogId}
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.nativeEvent.isComposing) {
            event.stopPropagation();
            dialog.current?.close();
          }
        }}
        onClick={(event) => {
          const target = event.target;
          if (!(target instanceof Element) || target.closest("button, input")) return;
          if (window.getSelection()?.isCollapsed === false) return;
          prompt.current?.focus({ preventScroll: true });
        }}
        className="theme-terminal fixed inset-auto bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-45 m-0 max-h-[calc(100dvh-2rem)] w-[40rem] max-w-[calc(100vw-2rem)] overflow-y-auto border border-ink bg-elevated/80 text-ink backdrop-blur-[5px]"
      >
        <header className="flex items-center justify-between gap-2 border-b border-ink bg-ink/90 pl-3 text-canvas">
          <h2 id={titleId} className="flex items-center gap-2 font-terminal text-[13px] uppercase tracking-widest">
            <Terminal size={14} strokeWidth={1.5} aria-hidden="true" />
            BIOS / Display
          </h2>
          <Button
            variant="ghost"
            className="btn-icon text-canvas hover:bg-canvas hover:text-ink focus-visible:-outline-offset-4 focus-visible:outline-current"
            aria-label="Close theme terminal"
            onClick={() => dialog.current?.close()}
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </Button>
        </header>

        <div
          ref={log}
          role="log"
          aria-label="Terminal output"
          tabIndex={0}
          className="h-64 max-h-[50dvh] space-y-2 overflow-y-auto px-3 py-2 font-terminal text-[13px] leading-tight wrap-anywhere"
        >
          <p className="text-muted">Type <code className="text-ink">help</code> or <code className="text-ink">theme list</code>.</p>
          {history.map(({ command, output }, index) => (
            <div key={index}>
              <p className="text-success-text"><span aria-hidden="true">&gt; </span>{command}</p>
              {typeof output === "string" ? (
                <p className="whitespace-pre-wrap">{output}</p>
              ) : (
                <ul>
                  {sortedThemes.map(({ id, label, scheme }) => {
                    const active = id === output.activeTheme;
                    return (
                      <li key={id} aria-current={active ? "true" : undefined} className="flex justify-between gap-2">
                        <span className={active ? "bg-accent text-accent-ink" : undefined}>
                          {id} — {label}
                        </span>
                        <span className="self-start border border-outline px-1 text-[10px] leading-tight text-muted uppercase">
                          {scheme}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={runCommand} className="flex min-h-9 items-center gap-2 bg-canvas/30 px-3">
          <span className="font-terminal text-base leading-tight text-success-text sm:text-[13px]" aria-hidden="true">&gt;</span>
          <input
            ref={prompt}
            className="min-w-0 flex-1 bg-transparent py-2 font-terminal text-base leading-tight text-ink caret-success-text [caret-shape:underscore] focus-visible:outline-none sm:text-[13px]"
            aria-label="Terminal command"
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint="go"
            spellCheck={false}
            maxLength={128}
            onKeyDown={handlePromptKeyDown}
          />
        </form>
      </dialog>
    </>
  );
}
