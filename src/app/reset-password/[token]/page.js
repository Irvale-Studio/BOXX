import { headers } from 'next/headers'
import ResetPasswordForm from './reset-password-form'

export default async function ResetPasswordPage({ params }) {
  const { token } = await params
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') || null
  return <ResetPasswordForm token={token} tenantId={tenantId} />
}
