import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jahincgcxomthyhwzqrw.supabase.co";
const SUPABASE_KEY = "sb_publishable_srE5RYN05ydXgrMnd6kd9w_MYIA_Rg7";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

