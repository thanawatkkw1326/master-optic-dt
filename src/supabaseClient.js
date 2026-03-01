import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kgbhwdbjjywaqnnucbgu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYmh3ZGJqanl3YXFubnVjYmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjQxNTIsImV4cCI6MjA4Nzk0MDE1Mn0.3g7Eq6zKcepo1SRqBgBJmOMFMbHlHlg8xeiTT36C_xo'

export const supabase = createClient(supabaseUrl, supabaseKey)