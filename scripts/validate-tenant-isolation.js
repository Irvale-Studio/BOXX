#!/usr/bin/env node
/**
 * Tenant Isolation Validation Script
 *
 * Tests that data from Tenant A (BOXX) cannot be seen by Tenant B (FitZone),
 * and vice versa. Uses the Supabase admin client directly.
 *
 * Prerequisites:
 * - Run supabase/seed.sql (main seed data)
 * - Run supabase/seed-tenant2.sql (test tenant)
 *
 * Usage: node scripts/validate-tenant-isolation.js
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const TENANT_A = 'a0000000-0000-0000-0000-000000000001' // BOXX
const TENANT_B = 'a0000000-0000-0000-0000-000000000002' // FitZone

let passed = 0
let failed = 0

function pass(test) {
  passed++
  console.log(`  ✓ ${test}`)
}

function fail(test, detail) {
  failed++
  console.error(`  ✗ ${test}`)
  if (detail) console.error(`    → ${detail}`)
}

async function assert(test, fn) {
  try {
    const result = await fn()
    if (result === true) pass(test)
    else fail(test, typeof result === 'string' ? result : 'Assertion failed')
  } catch (err) {
    fail(test, err.message)
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  Tenant Isolation Validation                 ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  // 1. Verify both tenants exist
  console.log('1. Tenant setup')
  await assert('Tenant A (BOXX) exists', async () => {
    const { data } = await supabase.from('tenants').select('name').eq('id', TENANT_A).single()
    return data?.name === 'BOXX Boxing Studio' || `Expected BOXX, got ${data?.name}`
  })

  await assert('Tenant B (FitZone) exists', async () => {
    const { data } = await supabase.from('tenants').select('name').eq('id', TENANT_B).single()
    return data?.name === 'FitZone Studio' || `Expected FitZone, got ${data?.name}`
  })

  // 2. User isolation
  console.log('\n2. User isolation')
  await assert('Tenant A users have tenant_id = A', async () => {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_A)
    return count > 0 || 'No users found for Tenant A'
  })

  await assert('Tenant B users have tenant_id = B', async () => {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_B)
    return count > 0 || 'No users found for Tenant B'
  })

  await assert('No users without tenant_id', async () => {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).is('tenant_id', null)
    return count === 0 || `${count} users have NULL tenant_id`
  })

  await assert('Tenant A users not visible with Tenant B filter', async () => {
    const { data: aUsers } = await supabase.from('users').select('email').eq('tenant_id', TENANT_A)
    const { data: bUsers } = await supabase.from('users').select('email').eq('tenant_id', TENANT_B)
    const aEmails = new Set(aUsers.map(u => u.email))
    const bEmails = new Set(bUsers.map(u => u.email))
    const overlap = [...aEmails].filter(e => bEmails.has(e))
    return overlap.length === 0 || `Overlapping emails: ${overlap.join(', ')}`
  })

  // 3. Class types isolation
  console.log('\n3. Class types isolation')
  await assert('Tenant A has BOXX class types', async () => {
    const { data } = await supabase.from('class_types').select('name').eq('tenant_id', TENANT_A)
    const names = data.map(c => c.name)
    return names.some(n => n.includes('BOXX')) || `Got: ${names.join(', ')}`
  })

  await assert('Tenant B has FitZone class types', async () => {
    const { data } = await supabase.from('class_types').select('name').eq('tenant_id', TENANT_B)
    const names = data.map(c => c.name)
    return names.some(n => n.includes('HIIT') || n.includes('Yoga')) || `Got: ${names.join(', ')}`
  })

  await assert('Tenant B cannot see BOXX class types', async () => {
    const { data } = await supabase.from('class_types').select('name').eq('tenant_id', TENANT_B)
    const names = data.map(c => c.name)
    return !names.some(n => n.includes('BOXX')) || 'Found BOXX class types in Tenant B!'
  })

  // 4. Instructor isolation
  console.log('\n4. Instructor isolation')
  await assert('Tenant A instructors not visible with B filter', async () => {
    const { data } = await supabase.from('instructors').select('name').eq('tenant_id', TENANT_B)
    const names = data.map(i => i.name)
    return !names.some(n => n === 'Bert' || n === 'Coach Dan') || 'BOXX instructors found in Tenant B!'
  })

  await assert('Tenant B has its own instructors', async () => {
    const { data } = await supabase.from('instructors').select('name').eq('tenant_id', TENANT_B)
    return data.length >= 2 || `Only ${data.length} instructors found`
  })

  // 5. Schedule isolation
  console.log('\n5. Schedule isolation')
  await assert('Tenant A schedule not visible with B filter', async () => {
    const { data: bSchedule } = await supabase.from('class_schedule').select('id, class_type_id').eq('tenant_id', TENANT_B)
    const { data: aClassTypes } = await supabase.from('class_types').select('id').eq('tenant_id', TENANT_A)
    const aTypeIds = new Set(aClassTypes.map(c => c.id))
    const leaked = bSchedule.filter(s => aTypeIds.has(s.class_type_id))
    return leaked.length === 0 || `${leaked.length} Tenant A classes found in B schedule`
  })

  // 6. Bookings isolation
  console.log('\n6. Bookings isolation')
  await assert('Tenant B bookings belong to Tenant B users', async () => {
    const { data: bBookings } = await supabase.from('bookings').select('user_id').eq('tenant_id', TENANT_B)
    const { data: bUsers } = await supabase.from('users').select('id').eq('tenant_id', TENANT_B)
    const bUserIds = new Set(bUsers.map(u => u.id))
    const foreign = bBookings.filter(b => !bUserIds.has(b.user_id))
    return foreign.length === 0 || `${foreign.length} bookings reference non-Tenant-B users`
  })

  // 7. Credits isolation
  console.log('\n7. Credits isolation')
  await assert('Tenant B credits belong to Tenant B users', async () => {
    const { data: bCredits } = await supabase.from('user_credits').select('user_id').eq('tenant_id', TENANT_B)
    const { data: bUsers } = await supabase.from('users').select('id').eq('tenant_id', TENANT_B)
    const bUserIds = new Set(bUsers.map(u => u.id))
    const foreign = bCredits.filter(c => !bUserIds.has(c.user_id))
    return foreign.length === 0 || `${foreign.length} credits reference non-Tenant-B users`
  })

  // 8. Packs isolation
  console.log('\n8. Packs isolation')
  await assert('Tenant A packs not visible with B filter', async () => {
    const { data } = await supabase.from('class_packs').select('name').eq('tenant_id', TENANT_B)
    const names = data.map(p => p.name)
    return !names.some(n => n.includes('BOXX') || n.includes('Drop-In')) || 'BOXX packs found in Tenant B!'
  })

  // 9. Studio settings isolation
  console.log('\n9. Studio settings isolation')
  await assert('Tenant B has its own settings', async () => {
    const { data } = await supabase.from('studio_settings').select('key, value').eq('tenant_id', TENANT_B)
    const nameRow = data.find(r => r.key === 'studio_name')
    return nameRow?.value === 'FitZone Studio' || `Got: ${nameRow?.value}`
  })

  await assert('Tenant A settings not leaked to B', async () => {
    const { data: aSettings } = await supabase.from('studio_settings').select('value').eq('tenant_id', TENANT_A).eq('key', 'studio_name')
    const { data: bSettings } = await supabase.from('studio_settings').select('value').eq('tenant_id', TENANT_B).eq('key', 'studio_name')
    if (!aSettings?.length || !bSettings?.length) return true // no overlap if one doesn't have it
    return aSettings[0].value !== bSettings[0].value || 'Same studio name for both tenants!'
  })

  // 10. Locations isolation
  console.log('\n10. Location isolation')
  await assert('Tenant A location is Chiang Mai', async () => {
    const { data } = await supabase.from('locations').select('city').eq('tenant_id', TENANT_A)
    return data.some(l => l.city === 'Chiang Mai') || `Got: ${data.map(l => l.city).join(', ')}`
  })

  await assert('Tenant B location is New York', async () => {
    const { data } = await supabase.from('locations').select('city').eq('tenant_id', TENANT_B)
    return data.some(l => l.city === 'New York') || `Got: ${data.map(l => l.city).join(', ')}`
  })

  // 11. Cross-tenant count sanity checks
  console.log('\n11. Count sanity checks')
  const tables = ['users', 'class_types', 'instructors', 'class_schedule', 'bookings', 'user_credits', 'class_packs']
  for (const table of tables) {
    await assert(`${table}: all rows have tenant_id`, async () => {
      const { count } = await supabase.from(table).select('id', { count: 'exact', head: true }).is('tenant_id', null)
      return count === 0 || `${count} rows with NULL tenant_id`
    })
  }

  // 12. Cross-reference integrity
  console.log('\n12. Cross-reference integrity')
  await assert('No bookings referencing classes from a different tenant', async () => {
    const { data: bookings } = await supabase.from('bookings').select('tenant_id, class_schedule_id')
    const { data: schedule } = await supabase.from('class_schedule').select('id, tenant_id')
    const schedMap = new Map(schedule.map(s => [s.id, s.tenant_id]))
    const mismatched = bookings.filter(b => schedMap.has(b.class_schedule_id) && schedMap.get(b.class_schedule_id) !== b.tenant_id)
    return mismatched.length === 0 || `${mismatched.length} bookings reference classes from different tenant`
  })

  await assert('No credits referencing packs from a different tenant', async () => {
    const { data: credits } = await supabase.from('user_credits').select('tenant_id, class_pack_id').not('class_pack_id', 'is', null)
    const { data: packs } = await supabase.from('class_packs').select('id, tenant_id')
    const packMap = new Map(packs.map(p => [p.id, p.tenant_id]))
    const mismatched = credits.filter(c => packMap.has(c.class_pack_id) && packMap.get(c.class_pack_id) !== c.tenant_id)
    return mismatched.length === 0 || `${mismatched.length} credits reference packs from different tenant`
  })

  // ─── Summary ───
  console.log('\n' + '═'.repeat(48))
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  console.log('═'.repeat(48))

  if (failed > 0) {
    console.log('\n  ⚠ Some tests failed. Review the data and fix tenant scoping.')
    process.exit(1)
  } else {
    console.log('\n  ✓ All tenant isolation checks passed!')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('Script error:', err)
  process.exit(1)
})
