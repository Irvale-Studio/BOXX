import { headers } from 'next/headers'
import ForgotPasswordForm from './forgot-password-form'

export default async function ForgotPasswordPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') || null
  return <ForgotPasswordForm tenantId={tenantId} />
}
