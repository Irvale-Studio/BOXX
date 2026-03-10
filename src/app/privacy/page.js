import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | BOXX Boxing Studio',
  description: 'Privacy Policy for BOXX Boxing Studio — how we collect, use, and protect your personal data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <Link href="/" className="text-accent hover:text-accent-dim text-sm mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-12">Last updated: March 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-foreground/90 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Who We Are</h2>
            <p>BOXX Boxing Studio (&ldquo;BOXX&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a boutique boxing and personal training studio located at 89/2 Bumruang Road, Wat Ket, Chiang Mai 50000, Thailand. This policy explains how we collect, use, and protect your personal data when you use our website and services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Data We Collect</h2>
            <p>We collect the following information when you register, book classes, or interact with our services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li><strong className="text-foreground">Account information:</strong> Name, email address, phone number, password (hashed)</li>
              <li><strong className="text-foreground">Profile data:</strong> Avatar image, bio, preferences</li>
              <li><strong className="text-foreground">Booking data:</strong> Class bookings, cancellations, attendance history</li>
              <li><strong className="text-foreground">Payment data:</strong> Transaction records (processed securely by Stripe — we do not store card details)</li>
              <li><strong className="text-foreground">Usage data:</strong> Login times, pages visited, device/browser information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Managing your account, bookings, and credits</li>
              <li>Sending booking confirmations, class reminders, and important updates</li>
              <li>Processing payments through Stripe</li>
              <li>Improving our services and user experience</li>
              <li>Communicating about schedule changes or studio announcements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li><strong className="text-foreground">Stripe:</strong> For secure payment processing</li>
              <li><strong className="text-foreground">Supabase:</strong> For secure data storage</li>
              <li><strong className="text-foreground">Resend:</strong> For transactional email delivery</li>
              <li><strong className="text-foreground">Vercel:</strong> For website hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. When you delete your account, we anonymize your personal data and remove identifiable information. Booking and payment records may be retained in anonymized form for business reporting purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights (PDPA Compliance)</h2>
            <p>Under the Thailand Personal Data Protection Act (PDPA), you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
              <li>Object to certain types of data processing</li>
            </ul>
            <p className="mt-3">You can exercise these rights through your account dashboard (data export and account deletion are available in Account Settings) or by contacting us directly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Security</h2>
            <p>We implement security measures including password hashing (bcrypt), HTTPS encryption, rate limiting on authentication endpoints, and row-level security on our database. While we strive to protect your data, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact</h2>
            <p>For privacy-related questions or to exercise your data rights:</p>
            <ul className="list-none mt-2 space-y-1 text-foreground/80">
              <li>Email: <a href="mailto:hello@boxxthailand.com" className="text-accent hover:text-accent-dim">hello@boxxthailand.com</a></li>
              <li>Phone: +66 93 497 2306</li>
              <li>Address: 89/2 Bumruang Road, Wat Ket, Chiang Mai 50000, Thailand</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
