import { useState, useEffect, useCallback } from "react";
import { SCRIPT_URL } from "./config";

export function useEntries(dateStr) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!dateStr) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=entries&date=${encodeURIComponent(dateStr)}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Failed to fetch entries. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}

export function useSummary(tabName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!tabName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=summary&date=${encodeURIComponent(tabName)}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Failed to fetch summary.");
    } finally {
      setLoading(false);
    }
  }, [tabName]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refresh: fetch_ };
}

export function useDates() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SCRIPT_URL}?action=dates`)
      .then(r => r.json())
      .then(j => setDates(j.dates || []))
      .catch(() => setDates([]))
      .finally(() => setLoading(false));
  }, []);

  return { dates, loading };
}

/**
 * Fetches all unique yyyy-MM-dd dates that exist in Sheet1 column A.
 * Uses the ?action=timestamps endpoint so the dashboard can offer a date picker
 * with only dates that actually have data — independent of summary tab names.
 */
export function useTimestampDates() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SCRIPT_URL}?action=timestamps`)
      .then(r => r.json())
      .then(j => setDates(j.dates || []))
      .catch(() => setDates([]))
      .finally(() => setLoading(false));
  }, []);

  return { dates, loading };
}

// Fetches entries for a specific date range (from/to inclusive, yyyy-mm-dd).
// Uses API ?from=&to= so Sheet1 rows are matched by real calendar day — not by summary tab names.
export function useDateRangeEntries(fromDate, toDate) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    if (!fromDate || !toDate) { setEntries([]); return; }
    setLoading(true); setError(null);
    try {
      const url = `${SCRIPT_URL}?action=entries&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
      const res = await fetch(url);
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (e) {
      setError("Failed to fetch entries for date range.");
    } finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { entries, loading, error, refresh: fetch_ };
}

// All rows from Sheet1 (no date filter) — does not depend on summary tabs.
export function useCumulativeEntries(enabled = false) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=entries`);
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (e) {
      setError("Failed to fetch cumulative entries.");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) fetch_();
  }, [enabled, fetch_]);

  return { entries, loading, error, refresh: fetch_ };
}
