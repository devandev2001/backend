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
