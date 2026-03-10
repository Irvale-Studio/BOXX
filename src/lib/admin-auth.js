import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Check if the current user has admin or employee access.
 * Returns { session, isAdmin, isEmployee } or a 401 response.
 *
 * Usage:
 *   const result = await requireStaff()
 *   if (result.response) return result.response
 *   const { session, isAdmin, isEmployee } = result
 */
export async function requireStaff() {
  const session = await auth()
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const role = session.user.role
  if (role !== 'owner' && role !== 'admin' && role !== 'employee') {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return {
    session,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isEmployee: role === 'employee',
  }
}

/**
 * Check if the current user is an admin or owner (not employee).
 * Returns { session, isOwner } or a 401 response.
 */
export async function requireAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (!session || (role !== 'admin' && role !== 'owner')) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, isOwner: role === 'owner' }
}

/**
 * Check if the current user is the owner.
 * Returns { session } or a 401 response.
 */
export async function requireOwner() {
  const session = await auth()
  if (!session || session.user.role !== 'owner') {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session }
}
