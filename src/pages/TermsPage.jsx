// ── src/pages/TermsPage.jsx ──
import React from 'react';

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-black dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Tea Leaves Terms of Use & Community Guidelines</h1>

      <p className="mb-6 text-sm italic">Effective Immediately</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">1. Welcome to Tea Leaves</h2>
        <p>
          Tea Leaves is a bedroom-startup web application that connects people through local discussions,
          events, and a free marketplace. By using our platform, you agree to these Terms of Use and our
          Privacy Policy. If you do not agree, please do not use Tea Leaves.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">2. Acceptance of Terms</h2>
        <p>
          These Terms take effect immediately upon your first visit or use of Tea Leaves. We reserve
          the right to modify these Terms at any time; when we do, we will notify you in-app. Continued
          use of Tea Leaves after notification constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">3. User Eligibility & Verification</h2>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>You must be at least 13 years old to create an account.</li>
          <li>
            You must use your real identity when signing up. Tea Leaves requires email verification
            before you can post or interact.
          </li>
          <li>You may not use Tea Leaves in any location where it is prohibited by law.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">4. Community Behavior Guidelines</h2>
        <p>We aim for respectful, constructive participation. You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Harass, bully, threaten, or intimidate other users.</li>
          <li>Use hate speech, slurs, or discriminatory language.</li>
          <li>Post false, misleading, or fraudulent content.</li>
          <li>Spam, excessively self-promote, or exploit the platform for unauthorized commercial gain.</li>
          <li>Solicit or distribute adult, illegal, or violent content.</li>
          <li>Infringe any third-party’s copyrights, trademarks, or other intellectual property rights.</li>
          <li>Impersonate others or falsely state affiliation with any person or entity.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">5. Marketplace Rules (Buying & Selling)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Tea Leaves does <strong>not</strong> process payments or charge any platform fee. All monetary
            transactions occur directly between buyers and sellers.
          </li>
          <li>
            Listings must be accurate, truthful, and currently available. Misrepresentation or fraudulent
            listings may result in warning, suspension, or ban.
          </li>
          <li>
            Prohibited items include (but are not limited to) drugs, weapons, counterfeit goods, stolen
            property, and any item illegal under local law.
          </li>
          <li>
            Tea Leaves is <strong>not</strong> responsible for transactions, refunds, or disputes. Buyers
            and sellers must resolve disputes among themselves; Tea Leaves provides no escrow or mediation.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">6. Auctions & Bidding</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tea Leaves allows sellers to post auction listings with a “reserve price” and/or “Buy Now” price.</li>
          <li>
            All bids are binding commitments. If you win an auction, you must complete the purchase within
            the timeframe set by the seller (typically 48 hours). Failure to do so may result in suspension
            of your bidding privileges.
          </li>
          <li>
            Sellers may cancel an auction at any time, but repeated cancellations may trigger suspension
            or ban.
          </li>
          <li>
            Bid manipulation (e.g., shill bidding, false bids, bid withdrawals without cause) is strictly
            prohibited. Violators may be warned, suspended, or banned.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">7. Events & Groups</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Event organizers are solely responsible for event safety, accuracy of details, and any costs or
            liabilities arising from their events. Tea Leaves is not a party to any event contract or payment.
          </li>
          <li>
            You may create or join public and private groups. Group content must follow our Community Behavior
            Guidelines. Community-appointed moderators will oversee group activity.
          </li>
          <li>
            Tea Leaves may audit or remove group content that violates these Terms.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">8. User Content & Ownership</h2>
        <p>
          You retain ownership of all content you post (text, images, listings, etc.). By posting, you
          grant Tea Leaves a non-exclusive, royalty-free license to display, distribute, and promote your
          content within the platform and for in-app marketing. We will not sell your content or personal
          data to third parties.
        </p>
        <p className="mt-2">
          You may delete your content or account at any time. Deleted content may persist for a reasonable
          time in backups or moderation logs, but will no longer be visible to other users.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">9. Moderation, Warnings & Appeals</h2>
        <p>We reserve the right to:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Remove or flag content that violates our rules.</li>
          <li>Issue warnings, mute, suspend, or ban users at our discretion.</li>
          <li>Allow community-appointed moderators to review and enforce rules.</li>
          <li>
            If your content is removed, you will receive a notification. You may reply to that notification
            or contact the moderator directly to appeal.
          </li>
          <li>
            Repeated or severe violations may result in immediate suspension or permanent ban without warning.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">10. Account Termination & Data Retention</h2>
        <p>
          You may deactivate your account at any time from your settings. We may suspend or delete accounts
          that violate these Terms. Deleted accounts are “soft deleted” for a reasonable retention period
          (to prevent abuse and for legal compliance). After that, data may be permanently purged.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">11. Privacy & Data</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>We store your data securely and use it only for core functionality (account, messaging, browsing).</li>
          <li>We do <strong>not</strong> log IP addresses, device fingerprints, or share your data with third parties.</li>
          <li>You may request data deletion by contacting us (see “Contact” below).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">12. Third-Party Integrations</h2>
        <p>
          Tea Leaves may use third-party services (e.g., ipapi.co for approximate location, cloud storage
          providers for media). These services may collect limited technical data (e.g., IP address) for
          their own privacy policies. We do not control those third-party policies; please review them
          before using features that rely on external services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">13. Disclaimers & Liability</h2>
        <p>
          Tea Leaves is provided “as is” without warranties of any kind. We are not liable for any loss,
          theft, fraud, or damages arising from user interactions, trades, or content—online or offline.
          Users are responsible for their own actions and agreements.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">14. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms are governed by the laws of Canada. Any dispute arising under these Terms shall
          be resolved in the appropriate courts of Canada. You consent to personal jurisdiction in that
          jurisdiction.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">15. Platform Changes & Updates</h2>
        <p>
          Tea Leaves is in active development. Features may change, be added, or removed. We reserve the
          right to update these Terms at any time; significant changes will be posted in-app with at least
          7 days’ notice where feasible.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-2">16. Contact</h2>
        <p>
          If you have questions about these Terms, please reach out to us at:{' '}
          <strong>support@tea-leaves.example.com</strong>. (This is a placeholder until formal support
          channels are established.)
        </p>
      </section>

      <p className="text-sm text-gray-500 italic">
        By using Tea Leaves, you agree to these Terms and promise to help build a respectful, local-first
        community. All rights reserved.
      </p>
    </div>
  );
}

export default TermsPage;
