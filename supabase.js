import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://javtoirdkiuewzzolxed.supabase.co';
const supabaseKey = 'sb_publishable_XpuVr59kdgeWUSkO9qh1vw_eFA9OmIj';

export const supabase = createClient(supabaseUrl, supabaseKey);