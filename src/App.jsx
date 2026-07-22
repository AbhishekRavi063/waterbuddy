import { useEffect, useMemo, useState } from "react";
import {
  buildNotificationPayload,
  characters,
  getPrompt,
  getReply,
  languages,
  pickCharacter,
  vibes,
} from "../data/dialogues";

const actionOptions = [
  { id: "success", label: "I drank it" },
  { id: "snooze", label: "2 more mins" },
  { id: "chaos", label: "Bring chai instead" },
];

const goals = [4, 6, 8];
const installSteps = [
  "Open this link in Safari on iPhone.",
  "Tap Share, then Add to Home Screen.",
  "Launch it from the home screen like an app.",
];
const storageKey = "water-buddy-state";
const notificationSupport = {
  notifications: typeof window !== "undefined" && "Notification" in window,
  serviceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  pushManager: typeof window !== "undefined" && "PushManager" in window,
};

function createReminder(step, language, vibe) {
  const character = pickCharacter(step);
  return {
    id: `msg-${step}-${language}-${vibe}`,
    speaker: character.name,
    avatar: character.avatar,
    accent: character.accent,
    colors: character.colors,
    body: getPrompt(language, vibe, step),
  };
}

export default function App() {
  const [language, setLanguage] = useState("english");
  const [vibe, setVibe] = useState("cute");
  const [goalIndex, setGoalIndex] = useState(1);
  const [waterCount, setWaterCount] = useState(0);
  const [reminderStep, setReminderStep] = useState(0);
  const [messages, setMessages] = useState([createReminder(0, "english", "cute")]);
  const [notificationPermission, setNotificationPermission] = useState(
    notificationSupport.notifications ? Notification.permission : "unsupported"
  );
  const [notificationStatus, setNotificationStatus] = useState(
    notificationSupport.notifications
      ? "Enable permission to test funny mobile notifications."
      : "This browser does not support web notifications."
  );

  useEffect(() => {
    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) {
      return;
    }

    try {
      const saved = JSON.parse(rawState);
      setLanguage(saved.language ?? "english");
      setVibe(saved.vibe ?? "cute");
      setGoalIndex(saved.goalIndex ?? 1);
      setWaterCount(saved.waterCount ?? 0);
      setReminderStep(saved.reminderStep ?? 0);
      setMessages(
        saved.messages?.length
          ? saved.messages
          : [createReminder(saved.reminderStep ?? 0, saved.language ?? "english", saved.vibe ?? "cute")]
      );
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        language,
        vibe,
        goalIndex,
        waterCount,
        reminderStep,
        messages,
      })
    );
  }, [goalIndex, language, messages, reminderStep, vibe, waterCount]);

  useEffect(() => {
    if (!notificationSupport.serviceWorker) {
      return;
    }

    navigator.serviceWorker.ready
      .then(() => {
        setNotificationStatus((current) =>
          current.includes("test funny mobile notifications")
            ? "Service worker is ready. You can enable notifications now."
            : current
        );
      })
      .catch(() => {
        setNotificationStatus("Service worker is not ready yet.");
      });
  }, []);

  const goal = goals[goalIndex];
  const progress = Math.min(waterCount / goal, 1);
  const latestCharacter = useMemo(
    () => characters[reminderStep % characters.length],
    [reminderStep]
  );

  const triggerReminder = () => {
    const nextStep = reminderStep + 1;
    const nextMessage = createReminder(nextStep, language, vibe);
    setReminderStep(nextStep);
    setMessages((current) => [nextMessage, ...current].slice(0, 6));
  };

  const handleAction = (type) => {
    if (type === "success") {
      setWaterCount((count) => count + 1);
    }

    const character = pickCharacter(reminderStep + 1);
    const reply = {
      id: `reply-${type}-${reminderStep}`,
      speaker: character.name,
      avatar: character.avatar,
      accent: character.accent,
      colors: character.colors,
      body: getReply(type, reminderStep),
    };

    setMessages((current) => [reply, ...current].slice(0, 6));
  };

  const refreshLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    setMessages((current) => [
      createReminder(reminderStep, nextLanguage, vibe),
      ...current.slice(1),
    ]);
  };

  const refreshVibe = (nextVibe) => {
    setVibe(nextVibe);
    setMessages((current) => [
      createReminder(reminderStep, language, nextVibe),
      ...current.slice(1),
    ]);
  };

  const enableNotifications = async () => {
    if (!notificationSupport.notifications) {
      setNotificationStatus("This browser cannot show notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === "granted") {
      setNotificationStatus(
        notificationSupport.pushManager
          ? "Notifications enabled. When you deploy a push backend, real mobile push can use this permission."
          : "Notifications enabled, but push delivery is limited on this browser."
      );
    } else {
      setNotificationStatus("Notification permission was not granted.");
    }
  };

  const sendTestNotification = async () => {
    if (notificationPermission !== "granted") {
      setNotificationStatus("Enable notifications first, then send a test one.");
      return;
    }

    if (!notificationSupport.serviceWorker) {
      setNotificationStatus("Service worker support is missing in this browser.");
      return;
    }

    const payload = buildNotificationPayload(language, vibe, reminderStep + 1);
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: payload.tag,
      data: payload.data,
    });

    setNotificationStatus("Funny test notification sent to the device notification tray.");
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Hydration Chaos Club</p>
        <h1>Install it free on iPhone. No App Store needed.</h1>
        <p className="subtitle">
          This version is a home-screen web app. It works offline for the saved
          UI and logs, and your friend can add it from Safari like an app.
        </p>

        <div
          className="character-spotlight"
          style={{ "--spotlight": latestCharacter.colors[0] }}
        >
          <div className="character-emoji">{latestCharacter.avatar}</div>
          <div>
            <h2>{latestCharacter.name}</h2>
            <p>{latestCharacter.accent}</p>
          </div>
        </div>
      </section>

      <section className="panel install-panel">
        <div>
          <h3>Install On iPhone</h3>
          <p>
            This is the free Apple-friendly path: open in Safari, add to home
            screen, and use it like a standalone app.
          </p>
        </div>
        <ol className="install-steps">
          {installSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="tiny-note">
          Closed-app random push notifications still need a real push backend.
          For the free version, keep the fun reminders inside the installed web
          app itself.
        </p>
      </section>

      <section className="panel">
        <h3>Push Notification Lab</h3>
        <p>
          This prepares the app for real mobile push. First allow permission,
          then send a funny test notification to the system notification tray.
        </p>
        <div className="pill-row">
          <span className="status-pill">Permission: {notificationPermission}</span>
          <span className="status-pill">
            Push support: {notificationSupport.pushManager ? "available" : "limited"}
          </span>
        </div>
        <div className="button-row">
          <button type="button" className="primary-button" onClick={enableNotifications}>
            Enable notifications
          </button>
          <button type="button" className="secondary-button" onClick={sendTestNotification}>
            Send funny test notification
          </button>
        </div>
        <p className="tiny-note">{notificationStatus}</p>
      </section>

      <section className="panel">
        <h3>Language</h3>
        <div className="pill-row">
          {languages.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pill ${item.id === language ? "active" : ""}`}
              onClick={() => refreshLanguage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <h3>Reminder Mood</h3>
        <div className="pill-row">
          {vibes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pill ${item.id === vibe ? "active" : ""}`}
              onClick={() => refreshVibe(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Today</span>
          <strong>{waterCount} glasses</strong>
        </article>
        <button
          type="button"
          className="stat-card stat-button"
          onClick={() => setGoalIndex((goalIndex + 1) % goals.length)}
        >
          <span>Goal</span>
          <strong>{goal} glasses</strong>
        </button>
      </section>

      <section className="panel progress-card">
        <div className="progress-header">
          <h3>Daily Progress</h3>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <p>Tap the goal card to switch between 4, 6, and 8 glasses.</p>
      </section>

      <section className="panel chat-card">
        <div className="chat-header">
          <h3>Funny Reminder Chat</h3>
          <button type="button" className="primary-button" onClick={triggerReminder}>
            Random reminder
          </button>
        </div>

        <div className="messages">
          {messages.map((message) => (
            <article className="message-row" key={message.id}>
              <div
                className="avatar-bubble"
                style={{ "--avatar-color": message.colors[1] }}
              >
                {message.avatar}
              </div>
              <div className="message-bubble">
                <div className="message-topline">
                  <strong>{message.speaker}</strong>
                  <span>{message.accent}</span>
                </div>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="action-row">
          {actionOptions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="action-button"
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
