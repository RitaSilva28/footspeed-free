import { App as NativeApp } from "@capacitor/app";
import { isAndroid } from "../lib/native";
import { useEffect, useState } from "react";
import { HISTORY_KEY, loadHistory, saveLocal } from "../lib/storage";
import {
  Dumbbell as TrainingIcon,
  History as HistoryIcon,
  X,
} from "lucide-react";
import logo from "../assets/Logotitle.svg";
import type { ExerciseSettings, CompletedExercise, Screen } from "../types";
import Settings from "./Settings";
import Exercise from "./Exercise";
import History from "./History";
import Footer from "./Footer";
import styles from "./Main.module.css";

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("settings");
  const [currentSettings, setCurrentSettings] =
    useState<ExerciseSettings | null>(null);
  const [initialHistory] = useState(loadHistory);
  const [exercises, setExercises] = useState(initialHistory.exercises);
  const [storageError, setStorageError] = useState(initialHistory.error);

  useEffect(() => {
    if (!isAndroid) return;
    const listener = NativeApp.addListener("backButton", () => {
      // Let an open editor consume Back before navigating away.
      if (!window.dispatchEvent(new Event("footspeed:back", { cancelable: true }))) return;
      if (currentScreen !== "settings") {
        setCurrentScreen("settings");
      } else {
        void NativeApp.minimizeApp();
      }
    });
    return () => { void listener.then((handle) => handle.remove()); };
  }, [currentScreen]);

  const handleStartExercise = (settings: ExerciseSettings) => {
    setCurrentSettings(settings);
    setCurrentScreen("exercise");
  };

  const handleCompleteExercise = (exercise: CompletedExercise) => {
    const updated = [exercise, ...exercises];
    const saved = saveLocal(HISTORY_KEY, updated);
    setStorageError(saved ? null : "This exercise could not be saved to your browser. It is available only in this session.");
    setExercises(updated);
  };

  const handleClearHistory = () => {
    if (!saveLocal(HISTORY_KEY, [])) {
      setStorageError("History could not be cleared from your browser. Please try again.");
      return;
    }
    setExercises([]);
    setStorageError(null);
  };

  const handleCancelExercise = () => {
    setCurrentScreen("settings");
  };

  return (
    <div className={styles.app}>
      <nav className={styles.navbar} aria-label="Main navigation">
  <img src={logo} alt="FootSpeed Logo" className={styles.logoImage} />

  <div className={styles.navButtons}>
    <div className={styles.navLeft}>
      <button
        className={`${styles.navBtn} ${
          currentScreen !== "history" ? styles.active : ""
        }`}
        aria-current={currentScreen !== "history" ? "page" : undefined}
        onClick={() => setCurrentScreen("settings")}
        disabled={currentScreen === "exercise"}
      >
        <TrainingIcon size={18} aria-hidden="true" />
        <span>Training</span>
      </button>

      <button
        className={`${styles.navBtn} ${
          currentScreen === "history" ? styles.active : ""
        }`}
        aria-current={currentScreen === "history" ? "page" : undefined}
        onClick={() => setCurrentScreen("history")}
        disabled={currentScreen === "exercise"}
      >
        <HistoryIcon size={18} aria-hidden="true" />
        <span>History</span>
      </button>
    </div>

  </div>
</nav>

      <main className={styles.content}>
        {storageError && (
          <div className={styles.storageNotice} role="alert">
            <p>{storageError}</p>
            <button type="button" className={styles.dismissNotice}
              aria-label="Dismiss storage warning" onClick={() => setStorageError(null)}>
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        {currentScreen === "settings" && (
          <Settings onStartExercise={handleStartExercise} />
        )}

        {currentScreen === "exercise" && currentSettings && (
          <Exercise
            settings={currentSettings}
            onComplete={handleCompleteExercise}
            onCancel={handleCancelExercise}
          />
        )}

        {currentScreen === "history" && (
          <History
            exercises={exercises}
            onClearHistory={handleClearHistory}
            onStartTraining={() => setCurrentScreen("settings")}
          />
        )}
      </main>
      < Footer />
    </div>
  );
}
