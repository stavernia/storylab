const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

export const publicAnonKey = supabaseAnonKey;

const host = (() => {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL");
  }
})();

export const projectId = host.split(".")[0];

const baseUrl = supabaseUrl.replace(/\/+$/, "");
export const functionsBaseUrl = `${baseUrl}/functions/v1`;
export const functionsPath = "/make-server-841a689e";
export const apiUrl = `${functionsBaseUrl}${functionsPath}`;
