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
const amritaImageUrl =
  "https://radviiokxmrzwzwxxssd.supabase.co/storage/v1/object/sign/static/amritha.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMGEzOTI2Mi1lM2YyLTQyMzEtYWI1Ny01M2YwODU5NTc4YWYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJzdGF0aWMvYW1yaXRoYS5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDcxMDAxMiwiZXhwIjoxODE2MjQ2MDEyfQ.bfaJVDQ4z_xLMTWnlzjB3Ys4JngeDwOV-KaUGFWyYi0";

const goals = [4, 6, 8];
const installSteps = [
  "Open this link in Safari on iPhone or Chrome on Android.",
  "Tap Share or browser menu, then Add to Home Screen.",
  "Launch it from the home screen like an app.",
];
const storageKey = "water-buddy-state";
const testIntervalMs = 5 * 60 * 1000;
const hourlyBuckets = [
  { key: "6-9", label: "6-9", start: 6, end: 9 },
  { key: "9-12", label: "9-12", start: 9, end: 12 },
  { key: "12-3", label: "12-3", start: 12, end: 15 },
  { key: "3-6", label: "3-6", start: 15, end: 18 },
  { key: "6-9p", label: "6-9", start: 18, end: 21 },
  { key: "9-12p", label: "9-12", start: 21, end: 24 },
];
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

function isToday(timestamp) {
  const value = new Date(timestamp);
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

function buildHourlyFrequency(drinkLog) {
  return hourlyBuckets.map((bucket) => ({
    ...bucket,
    count: drinkLog.filter((entry) => {
      const hour = new Date(entry.at).getHours();
      return hour >= bucket.start && hour < bucket.end;
    }).length,
  }));
}

export default function App() {
  const [language, setLanguage] = useState("english");
  const [vibe, setVibe] = useState("cute");
  const [goalIndex, setGoalIndex] = useState(1);
  const [reminderStep, setReminderStep] = useState(0);
  const [messages, setMessages] = useState([createReminder(0, "english", "cute")]);
  const [drinkLog, setDrinkLog] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState(
    notificationSupport.notifications ? Notification.permission : "unsupported"
  );
  const [notificationStatus, setNotificationStatus] = useState(
    notificationSupport.notifications
      ? "Enable permission to test funny mobile notifications."
      : "This browser does not support web notifications."
  );
  const [isTestScheduleRunning, setIsTestScheduleRunning] = useState(false);
  const [nextTestAt, setNextTestAt] = useState(null);

  const waterCount = useMemo(
    () => drinkLog.filter((entry) => isToday(entry.at)).length,
    [drinkLog]
  );
  const goal = goals[goalIndex];
  const progress = Math.min(waterCount / goal, 1);
  const latestCharacter = useMemo(
    () => characters[reminderStep % characters.length],
    [reminderStep]
  );
  const frequencyData = useMemo(() => buildHourlyFrequency(drinkLog), [drinkLog]);
  const maxFrequency = Math.max(...frequencyData.map((item) => item.count), 1);
  const recentDrinks = useMemo(() => drinkLog.slice(-6).reverse(), [drinkLog]);

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
      setReminderStep(saved.reminderStep ?? 0);
      setDrinkLog(saved.drinkLog ?? []);
      setMessages(
        saved.messages?.length
          ? saved.messages
          : [
              createReminder(
                saved.reminderStep ?? 0,
                saved.language ?? "english",
                saved.vibe ?? "cute"
              ),
            ]
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
        reminderStep,
        messages,
        drinkLog,
      })
    );
  }, [drinkLog, goalIndex, language, messages, reminderStep, vibe]);

  const recordDrink = (source) => {
    const entry = {
      id: `drink-${Date.now()}`,
      at: new Date().toISOString(),
      source,
    };

    setDrinkLog((current) => [...current, entry]);
    setNotificationStatus(
      source === "notification"
        ? "Marked as drank from the notification action."
        : "Hydration logged successfully."
    );
  };

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("hydrate") === "1") {
      recordDrink("notification");
      params.delete("hydrate");
      params.delete("source");
      const nextUrl = `${window.location.pathname}${
        params.toString() ? `?${params.toString()}` : ""
      }`;
      window.history.replaceState({}, "", nextUrl);
    }

    if (!notificationSupport.serviceWorker) {
      return;
    }

    const handleMessage = (event) => {
      if (event.data?.type === "HYDRATE_FROM_NOTIFICATION") {
        recordDrink("notification");
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const queueReminder = (step, nextLanguage = language, nextVibe = vibe) => {
    const reminder = createReminder(step, nextLanguage, nextVibe);
    setReminderStep(step);
    setMessages((current) => [reminder, ...current].slice(0, 6));
  };

  const showFunnyNotification = async (step, suffix = "") => {
    const payload = buildNotificationPayload(language, vibe, step);
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(payload.title, {
      body: `${payload.body}${suffix}`,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      tag: payload.tag,
      data: payload.data,
      actions: [
        { action: "mark-drank", title: "I drank" },
        { action: "open-app", title: "Open app" },
      ],
    });
  };

  useEffect(() => {
    if (!isTestScheduleRunning) {
      return undefined;
    }

    let timeoutId;
    let intervalId;

    const runScheduledNotification = async () => {
      const nextStep = reminderStep + 1;
      await showFunnyNotification(nextStep, " Test mode: 5-minute reminder.");
      queueReminder(nextStep);
      setNextTestAt(new Date(Date.now() + testIntervalMs).toLocaleTimeString());
      setNotificationStatus("Funny test notification delivered on the 5-minute test schedule.");
    };

    setNextTestAt(new Date(Date.now() + testIntervalMs).toLocaleTimeString());
    timeoutId = window.setTimeout(() => {
      runScheduledNotification();
      intervalId = window.setInterval(runScheduledNotification, testIntervalMs);
    }, testIntervalMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isTestScheduleRunning, language, reminderStep, vibe]);

  const triggerReminder = () => {
    queueReminder(reminderStep + 1);
  };

  const handleAction = (type) => {
    if (type === "success") {
      recordDrink("app");
    }

    const character = pickCharacter(reminderStep + 1);
    const reply = {
      id: `reply-${type}-${Date.now()}`,
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
          ? "Notifications enabled. The funny test alerts can now reach the system notification tray."
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

    await showFunnyNotification(reminderStep + 1);
    setNotificationStatus("Funny test notification sent to the device notification tray.");
  };

  const toggleTestSchedule = () => {
    if (notificationPermission !== "granted") {
      setNotificationStatus("Enable notifications first, then start the 5-minute test schedule.");
      return;
    }

    setIsTestScheduleRunning((current) => {
      const next = !current;
      if (!next) {
        setNextTestAt(null);
        setNotificationStatus("5-minute test schedule stopped.");
      } else {
        setNotificationStatus(
          "5-minute test schedule started. Keep the installed web app open while testing."
        );
      }
      return next;
    });
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Made By Abhishek For Amrita Nair</p>
        <h1>A funny water app for the girl who never drinks enough water.</h1>
        <p className="subtitle">
          Abhishek made this for Amrita Nair because she keeps forgetting to
          drink water. So now dramatic animals, cinema-level reminders, and
          silly chats are here to lovingly bully her into staying hydrated.
        </p>

        <div className="amrita-card">
          <img className="amrita-photo" src={amritaImageUrl} alt="Amrita Nair" />
          <div className="amrita-callout">
            <strong>Target acquired: Amrita Nair.</strong>
            <span>Official charge sheet: cute, funny, and criminally under-hydrated.</span>
          </div>
        </div>

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
          <h3>Install On Phone</h3>
          <p>
            Open it in Safari on iPhone or Chrome on Android, add it to the home
            screen, and use it like a real app for free.
          </p>
        </div>
        <ol className="install-steps">
          {installSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className="tiny-note">
          Notifications include an `I drank` action, so Amrita can log water
          straight from the notification itself.
        </p>
      </section>

      <section className="panel">
        <h3>Push Notification Lab</h3>
        <p>
          Enable notifications, send a funny test alert, or run a 5-minute test
          schedule while you are verifying the app.
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
          <button type="button" className="secondary-button" onClick={toggleTestSchedule}>
            {isTestScheduleRunning ? "Stop 5-minute test mode" : "Start 5-minute test mode"}
          </button>
        </div>
        {nextTestAt ? (
          <p className="tiny-note">Next 5-minute test notification: {nextTestAt}</p>
        ) : null}
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

      <section className="panel">
        <div className="progress-header">
          <h3>Hydration Frequency Graph</h3>
          <strong>{drinkLog.length} total logs</strong>
        </div>
        <div className="graph-card">
          {frequencyData.map((item) => (
            <div className="graph-column" key={item.key}>
              <span className="graph-count">{item.count}</span>
              <div
                className="graph-bar"
                style={{
                  height: `${Math.max((item.count / maxFrequency) * 100, item.count ? 16 : 6)}%`,
                }}
              />
              <span className="graph-label">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="tiny-note">
          This graph shows around what time of day she usually drinks water.
        </p>
        <div className="log-list">
          {recentDrinks.length ? (
            recentDrinks.map((entry) => (
              <div className="log-item" key={entry.id}>
                <strong>
                  {new Date(entry.at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </strong>
                <span>
                  {entry.source === "notification"
                    ? "Logged from notification"
                    : "Logged inside app"}
                </span>
              </div>
            ))
          ) : (
            <p className="tiny-note">
              No drinks logged yet. Tap `I drank it` or use the notification action.
            </p>
          )}
        </div>
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
