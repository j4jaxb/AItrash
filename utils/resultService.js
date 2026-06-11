import { supabase } from "../supabase";

const resultSelectWithEdit = `id, scan_date, material (material_name, recycle), edit`;
const resultSelectWithManual = `id, scan_date, material (material_name, recycle), is_manual`;
const resultSelectWithoutManual = `id, scan_date, material (material_name, recycle)`;

const fetchResults = async (userId, queryCallback) => {
  const baseQuery = supabase.from("result").select(resultSelectWithEdit).eq("user_id", userId);
  const query = queryCallback ? queryCallback(baseQuery) : baseQuery;
  let response = await query;
  let data = response.data;
  let error = response.error;

  const missingColumnError = error && (error.code === "42703" || error.code === "PGRST204");
  const messageContainsEdit = error && error.message && error.message.includes("edit");
  const messageContainsIsManual = error && error.message && error.message.includes("is_manual");

  if (missingColumnError && messageContainsEdit) {
    const fallbackQuery = queryCallback
      ? queryCallback(supabase.from("result").select(resultSelectWithManual).eq("user_id", userId))
      : supabase.from("result").select(resultSelectWithManual).eq("user_id", userId);
    response = await fallbackQuery;
    data = response.data;
    error = response.error;
  }

  if (missingColumnError && messageContainsIsManual) {
    const fallbackQuery = queryCallback
      ? queryCallback(supabase.from("result").select(resultSelectWithoutManual).eq("user_id", userId))
      : supabase.from("result").select(resultSelectWithoutManual).eq("user_id", userId);
    response = await fallbackQuery;
    data = response.data;
    error = response.error;
  }

  if (error) throw error;
  return data || [];
};

export const fetchUserResults = async ({ userId, orderBy, ascending = false, limit }) => {
  return fetchResults(userId, (query) => {
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  });
};

export const fetchAllUserResults = async (userId) => fetchResults(userId);

export const fetchResultsWithCallback = async (userId, callback) => fetchResults(userId, callback);

export const insertUserResults = async (inserts) => {
  const { error } = await supabase.from("result").insert(inserts);
  const missingColumnError = error && (error.code === "42703" || error.code === "PGRST204");
  if (missingColumnError && error.message && error.message.includes("edit")) {
    const manualInserts = inserts.map((item) => {
      const clone = { ...item };
      clone.is_manual = item.edit === 0;
      delete clone.edit;
      return clone;
    });
    const { error: fallbackError } = await supabase.from("result").insert(manualInserts);
    return { error: fallbackError };
  }
  if (missingColumnError && error.message && error.message.includes("is_manual")) {
    const plainInserts = inserts.map((item) => {
      const clone = { ...item };
      delete clone.is_manual;
      return clone;
    });
    const { error: fallbackError } = await supabase.from("result").insert(plainInserts);
    return { error: fallbackError };
  }
  return { error };
};
