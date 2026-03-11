import { requireStaff, getTenantPlan } from '@/lib/api-helpers'
import { getTenantFlags, getPlanLimits } from '@/lib/feature-flags'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const result = await requireStaff(request)
  if (result.response) return result.response
  const { tenantId } = result

  const plan = await getTenantPlan(tenantId)
  const [flags, limits] = await Promise.all([
    getTenantFlags(tenantId, plan),
    getPlanLimits(plan),
  ])

  return NextResponse.json({ plan, flags, limits })
}
