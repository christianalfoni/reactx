import { app } from "../app";

// ── Settings — lazy sub-state demo (getter + private field)

export function Settings() {
  const { settings } = app; // sub-state is lazily created on first access

  return (
    <section className="section">
      <h2>
        Settings{" "}
        <span className="tag">lazy sub-state · getter</span>
      </h2>

      <div className="settings-row">
        <label>Language</label>
        <select
          value={settings.language}
          onChange={(e) => settings.setLanguage(e.target.value)}
        >
          {["English", "Spanish", "French", "German"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </div>

      <div className="settings-row">
        <label>Notifications</label>
        <button
          className={settings.notifications ? "active" : ""}
          onClick={() => settings.toggleNotifications()}
        >
          {settings.notifications ? "On" : "Off"}
        </button>
      </div>
    </section>
  );
}
