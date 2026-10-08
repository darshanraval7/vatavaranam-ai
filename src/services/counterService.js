import { supabase } from './supabaseClient';

const STATS_ID = 'total_visits';

// 1. Website khule tyare Supabase Central DB ma Live Count +1 karva mate
export const incrementVisitCount = async () => {
  if (!supabase) {
    console.warn("Supabase credentials missing in .env! Please add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.");
    return null;
  }

  try {
    // A. Pehla atomic RPC function try karo (Supabase best practice)
    const { data: rpcCount, error: rpcError } = await supabase.rpc('increment_visit_count');
    
    if (!rpcError && rpcCount !== null && rpcCount !== undefined) {
      return Number(rpcCount);
    }

    if (rpcError) {
      console.warn("RPC not found or error, trying direct table update:", rpcError.message);
    }

    // B. Direct table select & update (Fallback jo RPC create na karyu hoy)
    const { data: existingData, error: fetchError } = await supabase
      .from('site_stats')
      .select('count')
      .eq('id', STATS_ID)
      .maybeSingle();

    if (!fetchError && existingData) {
      const newCount = (existingData.count || 0) + 1;
      const { error: updateError } = await supabase
        .from('site_stats')
        .update({ count: newCount, updated_at: new Date().toISOString() })
        .eq('id', STATS_ID);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return existingData.count;
      }
      return newCount;
    } else if (!fetchError && !existingData) {
      const initialCount = 1;
      const { error: insertError } = await supabase
        .from('site_stats')
        .insert([{ id: STATS_ID, count: initialCount, updated_at: new Date().toISOString() }]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return null;
      }
      return initialCount;
    } else {
      console.error("Supabase fetch error:", fetchError);
      return null;
    }
  } catch (err) {
    console.error("Supabase Counter Error:", err);
    return null;
  }
};

// 2. Total count GET karva mate (Count vadhya vagar)
export const getVisitCount = async () => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('site_stats')
      .select('count')
      .eq('id', STATS_ID)
      .maybeSingle();

    if (error || !data) return null;
    return Number(data.count);
  } catch (err) {
    console.error("Supabase Get Error:", err);
    return null;
  }
};