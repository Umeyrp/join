/**
 * Dev-build replacement for environment.ts (see angular.json fileReplacements).
 * Same Supabase project/keys, only production flips to false.
 */
export const environment = {
  production: false,
  supabaseUrl: 'https://bvtlcmkfsqprupaxjkkq.supabase.co',
  supabaseAnonKey: 'sb_publishable_g5pQYA-J1D8DTkkJM1B_DQ_YbvArvmI',
};
