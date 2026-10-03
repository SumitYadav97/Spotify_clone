// constants/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gebxaurqrqxmephfveev.supabase.co';
// Paste your public anon key copied from Supabase -> Project Settings -> API
const SUPABASE_ANON_KEY = 'PASTE_YOUR_SUPABASE_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);