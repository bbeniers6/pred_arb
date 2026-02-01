"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { AppSettings } from "@/types";

export default function SettingsPage() {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function handleSave() {
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateField(path: string, value: string | number) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: any = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  const inputClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Configure API credentials and trading parameters.</p>

      {/* Polymarket credentials */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          Polymarket
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="password"
              value={form.polymarket.apiKey}
              onChange={(e) => updateField("polymarket.apiKey", e.target.value)}
              className={inputClass}
              placeholder="Enter Polymarket API key"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Secret</label>
            <input
              type="password"
              value={form.polymarket.apiSecret}
              onChange={(e) => updateField("polymarket.apiSecret", e.target.value)}
              className={inputClass}
              placeholder="Enter Polymarket API secret"
            />
          </div>
        </div>
      </section>

      {/* Kalshi credentials */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Kalshi
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="password"
              value={form.kalshi.apiKey}
              onChange={(e) => updateField("kalshi.apiKey", e.target.value)}
              className={inputClass}
              placeholder="Enter Kalshi API key"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Secret</label>
            <input
              type="password"
              value={form.kalshi.apiSecret}
              onChange={(e) => updateField("kalshi.apiSecret", e.target.value)}
              className={inputClass}
              placeholder="Enter Kalshi API secret"
            />
          </div>
        </div>
      </section>

      {/* Trading parameters */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Trading Parameters</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Profit % to Show</label>
            <input
              type="number"
              value={form.minProfitPct}
              onChange={(e) => updateField("minProfitPct", Number(e.target.value))}
              className={inputClass}
              step={0.1}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Stake ($)</label>
            <input
              type="number"
              value={form.maxStake}
              onChange={(e) => updateField("maxStake", Number(e.target.value))}
              className={inputClass}
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Auto-refresh (seconds)</label>
            <input
              type="number"
              value={form.autoRefreshInterval}
              onChange={(e) => updateField("autoRefreshInterval", Number(e.target.value))}
              className={inputClass}
              min={5}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Match Confidence Threshold</label>
            <input
              type="number"
              value={form.matchConfidenceThreshold}
              onChange={(e) => updateField("matchConfidenceThreshold", Number(e.target.value))}
              className={inputClass}
              step={0.05}
              min={0}
              max={1}
            />
          </div>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-500 transition-colors text-white"
        >
          Save Settings
        </button>
        {saved && <span className="text-green-400 text-sm">Settings saved</span>}
      </div>
    </div>
  );
}
