import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | BOXX Boxing Studio',
  description: 'Terms of Service for BOXX Boxing Studio — rules and conditions for using our services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
        <Link href="/" className="text-accent hover:text-accent-dim text-sm mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted text-sm mb-12">Last updated: March 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-foreground/90 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the BOXX Boxing Studio website and services operated by BOXX Boxing Studio (&ldquo;BOXX&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) located at 89/2 Bumruang Road, Wat Ket, Chiang Mai 50000, Thailand.</p>
            <p>By creating an account or using our services, you agree to these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Accounts</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>One account per person — sharing accounts is not permitted</li>
              <li>You must be at least 16 years old to create an account (under-18s require parental consent for classes)</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Class Packs &amp; Credits</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Class packs are purchased through our platform via Stripe</li>
              <li>Each pack includes a set number of credits with a defined validity period</li>
              <li>Credits expire at the end of the validity period and cannot be extended</li>
              <li>Credits are non-transferable between members</li>
              <li>One credit is deducted per class booking (unless specified otherwise)</li>
              <li>Expired or unused credits are not refundable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Bookings &amp; Cancellations</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Classes can be booked through the member dashboard subject to availability</li>
              <li>Cancellations made more than 24 hours before class start time receive a full credit refund</li>
              <li>Cancellations made within 24 hours of class start time are considered late cancellations — no credit refund</li>
              <li>No-shows are treated as late cancellations</li>
              <li>BOXX reserves the right to cancel classes due to unforeseen circumstances — credits will be refunded</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Waitlist</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>When a class is full, you may join the waitlist</li>
              <li>If a spot opens, the first person on the waitlist is automatically booked and a credit is deducted</li>
              <li>Waitlist promotions are final — standard cancellation policy applies</li>
              <li>You can leave the waitlist at any time before promotion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Studio Rules</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>Arrive 5–10 minutes before your class</li>
              <li>Bring your own wraps and water bottle</li>
              <li>Follow all instructor safety guidance during classes</li>
              <li>Treat fellow members, instructors, and staff with respect</li>
              <li>BOXX is not responsible for personal items left at the studio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Health &amp; Safety</h2>
            <p>Boxing and fitness training involve physical exertion and inherent risks. By participating in our classes, you acknowledge that:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-foreground/80">
              <li>You are in good health and physically able to participate</li>
              <li>You will inform your instructor of any injuries, conditions, or limitations</li>
              <li>You participate at your own risk</li>
              <li>BOXX recommends consulting a physician before starting any exercise program</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Payments &amp; Refunds</h2>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              <li>All payments are processed securely through Stripe</li>
              <li>Prices are displayed in Thai Baht (฿)</li>
              <li>Refunds for purchased packs are handled on a case-by-case basis — contact us directly</li>
              <li>We reserve the right to modify pricing with reasonable notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">9. Intellectual Property</h2>
            <p>All content on the BOXX website — including text, images, branding, and design — is the property of BOXX Boxing Studio and may not be reproduced without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to Terms</h2>
            <p>We may update these Terms from time to time. Continued use of our services after changes constitutes acceptance of the updated Terms. We will notify members of significant changes via email.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact</h2>
            <p>For questions about these Terms:</p>
            <ul className="list-none mt-2 space-y-1 text-foreground/80">
              <li>Email: <a href="mailto:hello@boxxthailand.com" className="text-accent hover:text-accent-dim">hello@boxxthailand.com</a></li>
              <li>Phone: +66 93 497 2306</li>
              <li>Address: 89/2 Bumruang Road, Wat Ket, Chiang Mai 50000, Thailand</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">12. Governing Law</h2>
            <p>These Terms are governed by the laws of the Kingdom of Thailand. Any disputes shall be resolved in the courts of Chiang Mai, Thailand.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
