import { headers } from 'next/headers'
import LoginForm from './login-form'

export default async function LoginPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') || null
  const tenantSlug = headersList.get('x-tenant-slug') || null
  return <LoginForm tenantId={tenantId} tenantSlug={tenantSlug} />
}
