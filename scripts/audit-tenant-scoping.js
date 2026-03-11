#!/usr/bin/env node
/**
 * Audit: Check that all API routes properly scope queries by tenant_id.
 *
 * Scans all route.js files under src/app/api/ and checks:
 * 1. Every supabaseAdmin query on tenant-scoped tables includes .eq('tenant_id', ...)
 * 2. Every INSERT on tenant-scoped tables includes tenant_id
 * 3. No route uses the old admin-auth import
 *
 * Usage: node scripts/audit-tenant-scoping.js
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const API_DIR = join(process.cwd(), 'src', 'app', 'api')

const TENANT_SCOPED_TABLES = [
  'users', 'class_types', 'instructors', 'class_schedule',
  'bookings', 'user_credits', 'class_packs', 'waitlist',
  'studio_settings', 'admin_audit_log', 'email_log', 'page_views',
  'agent_conversations', 'agent_messages', 'agent_memory', 'agent_usage',
]

// Files that are allowed to skip tenant scoping
const SKIP_FILES = [
  'api/auth/[...nextauth]/route.js', // NextAuth handler
]

let warnings = 0
let passed = 0

function findRouteFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...findRouteFiles(full))
    } else if (entry === 'route.js') {
      files.push(full)
    }
  }
  return files
}

function audit(filePath) {
  const rel = relative(join(process.cwd(), 'src', 'app'), filePath).replace(/\\/g, '/')
  const content = readFileSync(filePath, 'utf-8')
  const issues = []

  // Skip allowed files
  if (SKIP_FILES.some(s => rel.includes(s))) return

  // Check for old admin-auth import
  if (content.includes("from '@/lib/admin-auth'")) {
    issues.push('Still imports from @/lib/admin-auth (should use @/lib/api-helpers)')
  }

  // Check for raw auth import used for session (should use api-helpers)
  if (content.includes("import { auth }") && content.includes("from '@/lib/auth'")) {
    // Only flag if it's using auth() for session checking, not for NextAuth handler export
    if (content.includes('await auth()') && !content.includes('handlers')) {
      issues.push('Uses raw auth() instead of requireAuth/requireStaff from api-helpers')
    }
  }

  // Check each tenant-scoped table reference
  for (const table of TENANT_SCOPED_TABLES) {
    // Check .from('table') patterns
    const fromPattern = new RegExp(`\\.from\\(['"\`]${table}['"\`]\\)`, 'g')
    const matches = content.match(fromPattern)
    if (!matches) continue

    // Count tenant_id references near each .from() call
    // Simple heuristic: check if tenant_id appears in the same logical block
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`.from('${table}')`) || lines[i].includes(`.from("${table}")`)) {
        // Look at surrounding lines (up to 15 lines ahead) for tenant_id
        const block = lines.slice(i, i + 15).join('\n')

        // Check for .eq('tenant_id' or tenant_id: in inserts
        const hasTenantFilter = block.includes("'tenant_id'") || block.includes('"tenant_id"') || block.includes('tenant_id:')

        // Also check if it's a .select() that joins (e.g., selecting from bookings with a join)
        // These are fine if the parent query is scoped
        const isJoin = lines[i].includes('.select(') && i > 0 && lines.slice(Math.max(0, i - 5), i).join('\n').includes("'tenant_id'")

        if (!hasTenantFilter && !isJoin) {
          issues.push(`${table} query at line ${i + 1} may be missing .eq('tenant_id', tenantId)`)
        }
      }
    }
  }

  if (issues.length > 0) {
    console.log(`\n  ⚠ ${rel}`)
    for (const issue of issues) {
      console.log(`    → ${issue}`)
      warnings++
    }
  } else {
    passed++
  }
}

console.log('\n╔══════════════════════════════════════════════╗')
console.log('║  Tenant Scoping Audit                        ║')
console.log('╚══════════════════════════════════════════════╝')

const files = findRouteFiles(API_DIR)
console.log(`\n  Scanning ${files.length} route files...\n`)

for (const file of files) {
  audit(file)
}

console.log('\n' + '═'.repeat(48))
console.log(`  ${passed} files clean, ${warnings} warnings`)
console.log('═'.repeat(48))

if (warnings > 0) {
  console.log('\n  Review warnings above. Some may be false positives')
  console.log('  (e.g., subqueries within an already-scoped block).\n')
}
