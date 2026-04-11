import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cngjgwtnaoecuwgakrpj.supabase.co'
const supabaseKey = 'sb_publishable_4AchmnqFGUX3epT2torLPw_u-ij7hkP' 

export const supabase = createClient(supabaseUrl, supabaseKey)