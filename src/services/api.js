// API service for PRIVISA – EdgeDefect AI

const API_BASE = '/api';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function getSamples() {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample catalog');
  return res.json();
}

export async function preprocessImage(data) {
  const res = await fetch(`${API_BASE}/preprocess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Preprocessing failed');
  return res.json();
}

export async function analyzePart(formData) {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Analysis pipeline failed');
  }
  return res.json();
}

export async function inspectLivePart(formData) {
  const res = await fetch(`${API_BASE}/inspect`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Live inspection failed');
  }
  return res.json();
}

export async function generateRootCause(payload) {
  const res = await fetch(`${API_BASE}/root-cause`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate Root-Cause Analysis');
  return res.json();
}

export async function getInspections(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.append('limit', params.limit);
  if (params.machine_id) query.append('machine_id', params.machine_id);
  if (params.result) query.append('result', params.result);

  const res = await fetch(`${API_BASE}/inspections?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch inspections');
  return res.json();
}

export async function getReviewQueue() {
  const res = await fetch(`${API_BASE}/review-queue`);
  if (!res.ok) throw new Error('Failed to fetch review queue');
  return res.json();
}

export async function submitReviewAction(inspection_id, action, notes = '') {
  const res = await fetch(`${API_BASE}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inspection_id, action, notes }),
  });
  if (!res.ok) throw new Error('Failed to submit review action');
  return res.json();
}

export async function getMachines() {
  const res = await fetch(`${API_BASE}/machines`);
  if (!res.ok) throw new Error('Failed to fetch machine health');
  return res.json();
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function reseedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reseed database');
  return res.json();
}
