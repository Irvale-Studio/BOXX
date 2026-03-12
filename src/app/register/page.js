import { headers } from 'next/headers'
import RegisterForm from './register-form'

export default async function RegisterPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id') || null
  const tenantSlug = headersList.get('x-tenant-slug') || null
  return <RegisterForm tenantId={tenantId} tenantSlug={tenantSlug} />
}
