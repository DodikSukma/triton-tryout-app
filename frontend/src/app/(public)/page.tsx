import { redirect } from 'next/navigation'

// The public marketing site now lives in the standalone `landingpage` app.
// Hitting the app root sends visitors straight to the login screen; the login
// page itself bounces already-authenticated users to their role dashboard.
export default function RootPage() {
  redirect('/login')
}
