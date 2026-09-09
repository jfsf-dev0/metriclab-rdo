import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://keadkoqnvabhyxbrfjax.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYWRrb3FudmFiaHl4YnJmamF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDgxMTEsImV4cCI6MjEwMjkyNDExMX0.aVyEH0S75-Ef1jBHU3j1EfnN9zospWeQMLGVkreZq-o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});
