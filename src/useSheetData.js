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

// Fetches entries for a specific date range (from/to inclusive)
export function useDateRangeEntries(fromDate, toDate) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    if (!fromDate || !toDate) { setEntries([]); return; }
    setLoading(true); setError(null);
    try {
      const datesRes = await fetch(`${SCRIPT_URL}?action=dates`);
      const datesJson = await datesRes.json();
      const allDates = datesJson.dates || [];

      // Convert API dates ("d/M/yyyy") to "yyyy-mm-dd" for safe string comparison
      const inRange = allDates.filter(d => {
        const [day, month, year] = d.split("/").map(Number);
        const iso = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        return iso >= fromDate && iso <= toDate;
      });

      if (inRange.length === 0) { setEntries([]); setLoading(false); return; }

      const results = await Promise.all(
        inRange.map(d =>
          fetch(`${SCRIPT_URL}?action=entries&date=${encodeURIComponent(d)}`)
            .then(r => r.json()).then(j => j.entries || []).catch(() => [])
        )
      );
      setEntries(results.flat());
    } catch (e) {
      setError("Failed to fetch entries for date range.");
    } finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { entries, loading, error, refresh: fetch_ };
}

// Fetches all available dates and merges all entries into one flat array
export function useCumulativeEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const datesRes = await fetch(`${SCRIPT_URL}?action=dates`);
      const datesJson = await datesRes.json();
      const dates = datesJson.dates || [];
      if (dates.length === 0) { setEntries([]); return; }

      const results = await Promise.all(
        dates.map(d =>
          fetch(`${SCRIPT_URL}?action=entries&date=${encodeURIComponent(d)}`)
            .then(r => r.json())
            .then(j => j.entries || [])
            .catch(() => [])
        )
      );
      setEntries(results.flat());
    } catch (e) {
      setError("Failed to fetch cumulative entries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { entries, loading, error, refresh: fetch_ };
}
