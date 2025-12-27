import { redirect } from 'next/navigation';

// Public signup is disabled - admin creates users via Supabase Dashboard
export default function SignupPage() {
  redirect('/login');
}
