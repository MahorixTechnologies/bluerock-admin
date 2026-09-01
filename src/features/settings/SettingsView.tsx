import type { AdminSettings } from '../../lib/adminCore';

export default function SettingsView({
  settings,
  onSettingsChange,
}: {
  settings: AdminSettings;
  onSettingsChange: React.Dispatch<React.SetStateAction<AdminSettings>>;
}) {
  return (
    <div className="stack">
      <div className="userDetailGrid userDetailGrid--two">
        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Business settings</span>
              <h3 className="panelTitle">Support and payout defaults</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="fieldGroup">
              <span className="fieldLabel">Support email</span>
              <input
                className="textInput"
                value={settings.companyEmail}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, companyEmail: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Support phone</span>
              <input
                className="textInput"
                value={settings.supportPhone}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
            </label>
            <label className="fieldGroup">
              <span className="fieldLabel">Default payout day</span>
              <input
                className="textInput"
                value={settings.payoutDay}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, payoutDay: e.target.value }))}
              />
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <span className="panelEyebrow">Platform controls</span>
              <h3 className="panelTitle">Operational toggles</h3>
            </div>
          </div>
          <div className="detailList">
            <label className="toggleRow">
              <span>
                <strong>Maintenance mode</strong>
                <small>Restrict platform access for maintenance windows.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => onSettingsChange((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
              />
            </label>
            <div className="detailRow">
              <span className="detailLabel">Service charge source</span>
              <strong>Managed from Incomes tab</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
