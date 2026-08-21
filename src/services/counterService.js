import { supabase } from './supabaseClient';

const STATS_ID = 'total_visits';
const LOCAL_STORAGE_KEY = 'vatavaranam_ai_visit_hits';
const BASE_FALLBACK_COUNT = 148; // Base starter count if DB is not yet connected

// Local storage fallback helper
const getLocalFallback = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const count = saved ? parseInt(saved, 10) : BASE_FALLBACK_COUNT;
    const nextCount = (isNaN(count) ? BASE_FALLBACK_COUNT : count) + 1;
    localStorage.setItem(LOCAL_STORAGE_KEY, nextCount.toString());
    return nextCount;
  } catch {
    return BASE_FALLBACK_COUNT + 1;
  }
};

const getLocalFallbackWithoutIncrement = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    const count = saved ? parseInt(saved, 10) : BASE_FALLBACK_COUNT;
    return isNaN(count) ? BASE_FALLBACK_COUNT : count;
  } catch {
    return BASE_FALLBACK_COUNT;
  }
};

// 1. Website khule tyare visit count +1 karva mate
export const incrementVisitCount = async () => {
  // Jo Supabase configure na hoy to local storage fallback વાપરો
  if (!supabase) {
    return getLocalFallback();
  }

  try {
    // A. Pehla atomic RPC function try karo
    const { data: rpcCount, error: rpcError } = await supabase.rpc('increment_visit_count');
    
    if (!rpcError && rpcCount !== null && rpcCount !== undefined) {
      const numericCount = Number(rpcCount);
      localStorage.setItem(LOCAL_STORAGE_KEY, numericCount.toString());
      return numericCount;
    }

    // B. Jo RPC function na hoy to direct table upsert/update try karo
    const { data: existingData, error: fetchError } = await supabase
      .from('site_stats')
      .select('count')
      .eq('id', STATS_ID)
      .maybeSingle();

    if (!fetchError && existingData) {
      const newCount = (existingData.count || 0) + 1;
      await supabase
        .from('site_stats')
        .update({ count: newCount, updated_at: new Date().toISOString() })
        .eq('id', STATS_ID);

      localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
      return newCount;
    } else if (!fetchError && !existingData) {
      const initialCount = 1;
      await supabase
        .from('site_stats')
        .insert([{ id: STATS_ID, count: initialCount, updated_at: new Date().toISOString() }]);

      localStorage.setItem(LOCAL_STORAGE_KEY, initialCount.toString());
      return initialCount;
    }

    // Jo Supabase table na male to fallback
    return getLocalFallback();
  } catch (err) {
    console.warn("Supabase Counter Fallback:", err);
    return getLocalFallback();
  }
};

// 2. Total count GET karva mate (Count vadhya vagar)
export const getVisitCount = async () => {
  if (!supabase) {
    return getLocalFallbackWithoutIncrement();
  }

  try {
    const { data, error } = await supabase
      .from('site_stats')
      .select('count')
      .eq('id', STATS_ID)
      .maybeSingle();

    if (error || !data) {
      return getLocalFallbackWithoutIncrement();
    }

    return data.count;
  } catch (err) {
    return getLocalFallbackWithoutIncrement();
  }
};