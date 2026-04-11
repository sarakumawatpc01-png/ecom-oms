'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card } from '@agencyfic/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type CommunicationSettings = {
  otpExpiryMinutes: number;
  emailWebhookUrl: string;
  smsWebhookUrl: string;
  whatsappWebhookUrl: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
};

const defaultSettings: CommunicationSettings = {
  otpExpiryMinutes: 10,
  emailWebhookUrl: '',
  smsWebhookUrl: '',
  whatsappWebhookUrl: '',
  emailEnabled: true,
  smsEnabled: false,
  whatsappEnabled: false,
};

export function SuperadminCommunicationSettings() {
  const [settings, setSettings] = useState<CommunicationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusError, setStatusError] = useState(false);

  const endpoint = useMemo(() => `${API_URL}/api/site-settings/admin/communication-settings`, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      setStatusMessage('');
      try {
        const response = await fetch(endpoint, { credentials: 'include', cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load communication settings');
        }
        const data = (await response.json()) as CommunicationSettings;
        setSettings({
          otpExpiryMinutes: data.otpExpiryMinutes ?? defaultSettings.otpExpiryMinutes,
          emailWebhookUrl: data.emailWebhookUrl ?? defaultSettings.emailWebhookUrl,
          smsWebhookUrl: data.smsWebhookUrl ?? defaultSettings.smsWebhookUrl,
          whatsappWebhookUrl: data.whatsappWebhookUrl ?? defaultSettings.whatsappWebhookUrl,
          emailEnabled: data.emailEnabled ?? defaultSettings.emailEnabled,
          smsEnabled: data.smsEnabled ?? defaultSettings.smsEnabled,
          whatsappEnabled: data.whatsappEnabled ?? defaultSettings.whatsappEnabled,
        });
      } catch (error) {
        setStatusError(true);
        setStatusMessage((error as Error).message || 'Unable to load settings');
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, [endpoint]);

  const onSave = async () => {
    setSaving(true);
    setStatusMessage('');
    setStatusError(false);
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }
      setStatusMessage('Communication settings saved');
    } catch (error) {
      setStatusError(true);
      setStatusMessage((error as Error).message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <h3 className="text-sm font-bold">OTP, Email, and SMS Setup</h3>
      <p className="mt-1 text-sm text-slate-600">Configure OTP expiry and notification delivery channels for all sellers.</p>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading settings…</p> : null}

      {!loading ? (
        <div className="mt-4 space-y-4 text-sm">
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">OTP Expiry (minutes)</span>
            <input
              type="number"
              min={1}
              max={30}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={settings.otpExpiryMinutes}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, otpExpiryMinutes: Number.parseInt(event.target.value || '0', 10) || 1 }))
              }
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, emailEnabled: event.target.checked }))}
              />
              <span>Email enabled</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={settings.smsEnabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, smsEnabled: event.target.checked }))}
              />
              <span>SMS enabled</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <input
                type="checkbox"
                checked={settings.whatsappEnabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, whatsappEnabled: event.target.checked }))}
              />
              <span>WhatsApp enabled</span>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">Email Webhook URL</span>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="https://..."
              value={settings.emailWebhookUrl}
              onChange={(event) => setSettings((prev) => ({ ...prev, emailWebhookUrl: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">SMS Webhook URL</span>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="https://..."
              value={settings.smsWebhookUrl}
              onChange={(event) => setSettings((prev) => ({ ...prev, smsWebhookUrl: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-semibold text-slate-700">WhatsApp Webhook URL</span>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="https://..."
              value={settings.whatsappWebhookUrl}
              onChange={(event) => setSettings((prev) => ({ ...prev, whatsappWebhookUrl: event.target.value }))}
            />
          </label>

          <div className="flex items-center gap-3">
            <Button variant="admin" onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Communication Settings'}
            </Button>
            {statusMessage ? (
              <span className={`text-sm ${statusError ? 'text-red-600' : 'text-emerald-600'}`}>{statusMessage}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
