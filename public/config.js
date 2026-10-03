// YOURS cloud settings. Leave supabaseAnonKey empty to keep everything on the device (no accounts across devices).
// Both values are public by design: the anon key only works within the row-level security rules in supabase/schema.sql.
// Never put the service_role key here.
window.YOURS_CONFIG = {
  supabaseUrl: 'https://bbziozglnpamfvepnxfp.supabase.co',
  // Public half of the web push key pair (the private half is VAPID_PRIVATE_KEY in Vercel).
  vapidPublicKey: 'BNaFDEPYr97ouYX3AErtEpIXAHXW4F8qKj50W4CMf3NvhJdqARDW8jscAwjtiHT_-CcsAw6s3FwsfmMeaFAwN54',
  supabaseAnonKey: 'sb_publishable_N5hltz4KM5enX3o95biU9A_nU1-tbzf',
};
