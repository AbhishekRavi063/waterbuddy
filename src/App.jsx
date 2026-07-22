import { useEffect, useMemo, useState } from "react";
import { buildNotificationPayload } from "../data/dialogues";

const amritaImageUrl = "/icons/amrita.jpg";
const goals = [4, 6, 8];
const storageKey = "water-buddy-state";
const visitStorageKey = "water-buddy-visit-count";
const reminderIntervalMs = 2 * 60 * 60 * 1000;
const heroMessages = [
  {
    eyebrow: "Made By Abhishek For Amrita",
    title: "This app is for this girl because she does not drink water.",
    subtitle:
      "Made by Abhishek for Amrita. Cute girl, low hydration, big problem. So this app is here to remind her properly.",
    calloutTitle: "Amrita",
    calloutText: "Beautiful face. Very suspicious water habits.",
  },
  {
    eyebrow: "Abhishek vs Dehydration",
    title: "Special app for the girl who treats water like an optional side quest.",
    subtitle:
      "Abhishek made this for Amrita because apparently remembering water is harder than being cute all day.",
    calloutTitle: "Amrita spotted",
    calloutText: "Looks innocent. Hydration record says otherwise.",
  },
  {
    eyebrow: "Personal Case File",
    title: "This whole app exists because one girl keeps forgetting to drink water.",
    subtitle:
      "Made by Abhishek for Amrita, whose talents include being adorable and ignoring the water bottle for dramatic effect.",
    calloutTitle: "Primary suspect",
    calloutText: "Charged with charm, mischief, and chronic under-hydration.",
  },
  {
    eyebrow: "Emergency Romance Department",
    title: "Pretty girl detected. Water discipline not detected.",
    subtitle:
      "Abhishek built this for Amrita so someone can lovingly interrupt the nonsense and say: drink water first.",
    calloutTitle: "Amrita Nair",
    calloutText: "Very photogenic. Very forgetful with hydration.",
  },
];
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
};

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
  const [goalIndex, setGoalIndex] = useState(1);
  const [reminderStep, setReminderStep] = useState(0);
  const [drinkLog, setDrinkLog] = useState([]);
  const [notificationPermission, setNotificationPermission] = useState(
    notificationSupport.notifications ? Notification.permission : "unsupported"
  );
  const [notificationStatus, setNotificationStatus] = useState("");
  const [isTestScheduleRunning, setIsTestScheduleRunning] = useState(false);
  const [nextTestAt, setNextTestAt] = useState(null);
  const [visitCount, setVisitCount] = useState(0);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installHint, setInstallHint] = useState("");

  const waterCount = useMemo(
    () => drinkLog.filter((entry) => isToday(entry.at)).length,
    [drinkLog]
  );
  const heroMessage = heroMessages[visitCount % heroMessages.length];
  const goal = goals[goalIndex];
  const progress = Math.min(waterCount / goal, 1);
  const frequencyData = useMemo(() => buildHourlyFrequency(drinkLog), [drinkLog]);
  const maxFrequency = Math.max(...frequencyData.map((item) => item.count), 1);
  const recentDrinks = useMemo(() => drinkLog.slice(-6).reverse(), [drinkLog]);

  useEffect(() => {
    const rawVisits = window.localStorage.getItem(visitStorageKey);
    const nextVisitCount = Number.parseInt(rawVisits ?? "0", 10) || 0;
    setVisitCount(nextVisitCount);
    window.localStorage.setItem(visitStorageKey, String(nextVisitCount + 1));

    const rawState = window.localStorage.getItem(storageKey);
    if (!rawState) {
      return;
    }

    try {
      const saved = JSON.parse(rawState);
      setGoalIndex(saved.goalIndex ?? 1);
      setReminderStep(saved.reminderStep ?? 0);
      setDrinkLog(saved.drinkLog ?? []);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        goalIndex,
        reminderStep,
        drinkLog,
      })
    );
  }, [drinkLog, goalIndex, reminderStep]);

  const recordDrink = (source) => {
    const entry = {
      id: `drink-${Date.now()}`,
      at: new Date().toISOString(),
      source,
    };
    setDrinkLog((current) => [...current, entry]);
    setNotificationStatus(
      source === "notification"
        ? "Logged from notification."
        : "Water logged."
    );
  };

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

  const showFunnyNotification = async (step, suffix = "") => {
    if (!notificationSupport.serviceWorker) {
      return;
    }

    const payload = buildNotificationPayload(step);
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(payload.title, {
      body: `${payload.body}${suffix}`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: payload.data,
      actions: [
        { action: "mark-drank", title: "I drank" },
        { action: "open-app", title: "Open app" },
      ],
    });
  };

  const enableNotifications = async () => {
    if (!notificationSupport.notifications) {
      setNotificationStatus("Notifications not supported here.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    setNotificationStatus(
      permission === "granted"
        ? "Notifications enabled."
        : "Notification permission denied."
    );
  };

  const sendReminder = async () => {
    const nextStep = reminderStep + 1;

    if (notificationPermission !== "granted") {
      await enableNotifications();
    }

    if (Notification.permission === "granted") {
      await showFunnyNotification(nextStep);
      setNotificationStatus("Reminder sent.");
    }

    setReminderStep(nextStep);
  };

  useEffect(() => {
    if (!isTestScheduleRunning) {
      return undefined;
    }

    let timeoutId;
    let intervalId;

    const runScheduledNotification = async () => {
      const nextStep = reminderStep + 1;
      await showFunnyNotification(nextStep, " Test mode.");
      setReminderStep(nextStep);
      setNextTestAt(new Date(Date.now() + reminderIntervalMs).toLocaleTimeString());
    };

    setNextTestAt(new Date(Date.now() + reminderIntervalMs).toLocaleTimeString());
    timeoutId = window.setTimeout(() => {
      runScheduledNotification();
      intervalId = window.setInterval(runScheduledNotification, reminderIntervalMs);
    }, reminderIntervalMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isTestScheduleRunning, reminderStep]);

  const toggleTestSchedule = async () => {
    if (notificationPermission !== "granted") {
      await enableNotifications();
      if (Notification.permission !== "granted") {
        return;
      }
    }

    setIsTestScheduleRunning((current) => {
      const next = !current;
      if (!next) {
        setNextTestAt(null);
        setNotificationStatus("2-hour reminder cycle stopped.");
      } else {
        setNotificationStatus("2-hour reminder cycle started.");
      }
      return next;
    });
  };

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      setInstallHint(
        choice.outcome === "accepted"
          ? "App install started."
          : "Install dismissed."
      );
      setInstallPromptEvent(null);
      return;
    }

    setInstallHint(
      /iphone|ipad|ipod/i.test(window.navigator.userAgent)
        ? "Open in Safari, tap Share, then Add to Home Screen."
        : "Open browser menu and choose Install app or Add to Home Screen."
    );
  };

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">{heroMessage.eyebrow}</p>
        <h1>{heroMessage.title}</h1>
        <p className="subtitle">{heroMessage.subtitle}</p>

        <div className="amrita-card">
          <img className="amrita-photo" src={amritaImageUrl} alt="Amrita Nair" />
          <div className="amrita-callout">
            <strong>{heroMessage.calloutTitle}</strong>
            <span>{heroMessage.calloutText}</span>
          </div>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-button" onClick={() => recordDrink("app")}>
            I drank water
          </button>
          <button type="button" className="secondary-button" onClick={sendReminder}>
            Remind me
          </button>
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

      <section className="panel">
        <div className="progress-header">
          <h3>Hydration Frequency</h3>
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
            <p className="tiny-note">No drinks logged yet.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={enableNotifications}>
            Enable notifications
          </button>
          <button type="button" className="secondary-button" onClick={toggleTestSchedule}>
            {isTestScheduleRunning ? "Stop 2-hour reminders" : "Start 2-hour reminders"}
          </button>
        </div>
        {nextTestAt ? (
          <p className="tiny-note">Next reminder: {nextTestAt}</p>
        ) : null}
        {notificationStatus ? <p className="tiny-note">{notificationStatus}</p> : null}
      </section>

      <section className="panel install-panel">
        <h3>Download App</h3>
        <p>Install this website like an app on the phone.</p>
        <button type="button" className="primary-button install-button" onClick={handleInstallApp}>
          Download app
        </button>
        {installHint ? <p className="tiny-note">{installHint}</p> : null}
      </section>
    </main>
  );
}
