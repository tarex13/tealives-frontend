// src/pages/TermsPage.jsx
import React from 'react';

function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-extrabold mb-2 text-center">
        📜 Terms of Use & Community Guidelines
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-10 italic">
        Effective June 27, 2025 – Tealives
      </p>

      <div className="space-y-10">

        {/* 0. Definitions */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">0. Definitions</h2>
          <ul className="list-disc pl-6 space-y-1 text-base">
            <li><strong>“Tealives”</strong> – the platform, website, apps, and services operated under this name.</li>
            <li><strong>“User”</strong> – any person accessing or using Tealives.</li>
            <li><strong>“Content”</strong> – posts, comments, listings, media, messages, and any material you upload.</li>
            <li><strong>“Moderator”</strong> – a user granted elevated rights to enforce rules in a city or group.</li>
            <li><strong>“Group”</strong> – a public or private circle created within Tealives.</li>
            <li><strong>“Marketplace Listing”</strong> – an item you offer for sale or trade.</li>
            <li><strong>“Event”</strong> – a scheduled gathering you create or RSVP to.</li>
          </ul>
        </section>

        {/* 1. Welcome */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Welcome to Tealives</h2>
          <p className="leading-relaxed">
            Tealives is a Canadian startup web application that connects neighbours through local discussions,
            events, and a free peer-to-peer marketplace. By using our platform, you agree to these Terms of Use
            and our <a href="/privacy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</a>. If you
            do not agree, please do not use Tealives.
          </p>
        </section>

        {/* 2. Acceptance of Terms */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            These Terms take effect immediately upon your first visit or use of Tealives. We may modify these Terms
            at any time; when we do, we'll notify you in-app. Continued use after notification constitutes
            acceptance of the revised Terms.
          </p>
        </section>

        {/* 3. User Eligibility & Verification */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">3. User Eligibility & Verification</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>You must be at least 13 years old to create an account (COPPA compliance).</li>
            <li>You must use your real identity and verify your email before posting or interacting.</li>
            <li>Do not use Tealives in jurisdictions where it is prohibited by law.</li>
          </ul>
        </section>

        {/* 4. Community Behavior Guidelines */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Community Behavior Guidelines</h2>
          <p className="mb-3">We aim for respectful, constructive participation. You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>Harass, bully, or threaten others.</li>
            <li>Use discriminatory, hateful, or violent language.</li>
            <li>Spread false or misleading information.</li>
            <li>Spam or abuse the platform commercially.</li>
            <li>Violate intellectual property rights or impersonate others.</li>
          </ul>
        </section>

        {/* 5. Marketplace Rules */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Marketplace Rules</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>No payments are handled by Tealives. All sales are peer-to-peer.</li>
            <li>Listings must be accurate, legal, and honest.</li>
            <li>Prohibited: weapons, drugs, counterfeit or stolen items.</li>
            <li>No dispute resolution is provided; users transact at their own risk.</li>
          </ul>
        </section>

        {/* 6. Auctions & Bidding */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Auctions & Bidding</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>Bids are binding. Winning bidders must complete purchase within 48 hours.</li>
            <li>Sellers may cancel auctions, but frequent abuse may incur penalties.</li>
            <li>No shill bidding or bid manipulation.</li>
          </ul>
        </section>

        {/* 7. Events & Groups */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Events & Groups</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>Organizers are responsible for their event’s safety and legality.</li>
            <li>Group content must follow community guidelines; moderators enforce rules.</li>
            <li>Tealives may audit or remove group content at our discretion.</li>
          </ul>
        </section>

        {/* 8. User Content & Ownership */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">8. User Content & Ownership</h2>
          <p className="leading-relaxed">
            You retain ownership of your Content but grant Tealives a non-exclusive license to display it on our platform.
            We do not sell your Content or personal data.
          </p>
          <p className="mt-2 leading-relaxed">
            You may delete your Content or account at any time. We retain backups for moderation and legal purposes.
          </p>
        </section>

        {/* 9. Moderation, Warnings & Appeals */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Moderation, Warnings & Appeals</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>We may remove Content or suspend users for violations.</li>
            <li>Moderators can issue warnings, bans, or suspensions.</li>
            <li>
              To appeal a decision or report content, reply to the moderator’s message,
              or email <strong>support@tealives.com</strong>. You may also message any
              city moderator you find.
            </li>
          </ul>
        </section>

        {/* 10. Account Termination & Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">10. Account Termination & Data Retention</h2>
          <p className="leading-relaxed">
            You may deactivate your account at any time. We retain deactivated accounts
            and deleted Content for at least 30 days for moderation and legal reasons,
            after which they are permanently erased.
          </p>
        </section>

        {/* 11. Copyright & DMCA */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">11. Copyright & DMCA</h2>
          <p className="leading-relaxed">
            Tealives respects intellectual property rights. If you believe your copyrighted material
            has been posted without permission, email a DMCA notice to&nbsp;
            <strong>copyright@tealives.com</strong>. Include your contact details, a description
            of the material, and a statement under penalty of perjury.
          </p>
        </section>

        {/* 12. Security & Passwords */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">12. Security & Passwords</h2>
          <p className="leading-relaxed">
            You are responsible for maintaining the confidentiality of your password and account.
            Notify us immediately at <strong>security@tealives.com</strong> if you suspect unauthorized access.
          </p>
        </section>

        {/* 13. Children & COPPA Compliance */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">13. Children & COPPA Compliance</h2>
          <p className="leading-relaxed">
            Tealives does not knowingly collect personal information from anyone under 13.
            If we learn a user is under 13, we will delete the account.
          </p>
        </section>

        {/* 14. Cookies & Sessions */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">14. Cookies & Sessions</h2>
          <p className="leading-relaxed">
            We use essential cookies—such as JWT refresh tokens and CSRF session cookies—to power
            authentication and security. We do not set analytics or tracking cookies.
          </p>
        </section>

        {/* 15. Right to Moderate Content */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">15. Right to Moderate Content</h2>
          <p className="leading-relaxed">
            Tealives reserves the right to review, edit, move, or delete any Content, suspend or
            ban users, and approve or disallow any Group at our discretion.
          </p>
        </section>

        {/* 16. Privacy & Data */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">16. Privacy & Data</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>Data is used only to power your account and Tealives features.</li>
            <li>We do not sell or share your personal data.</li>
            <li>You can request data deletion by contacting us.</li>
          </ul>
        </section>

        {/* 17. Third-Party Integrations */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">17. Third-Party Integrations</h2>
          <p className="leading-relaxed">
            We use third-party APIs (e.g. for location, image hosting). Those services may collect
            technical data under their own policies.
          </p>
        </section>

        {/* 18. Disclaimers & Liability */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">18. Disclaimers & Liability</h2>
          <p className="leading-relaxed">
            Tealives is provided “as is.” We are not liable for user actions, damages, or loss.
            Use caution when meeting others or completing trades. We’re not lawyers—please don’t sue us.
          </p>
        </section>

        {/* 19. Governing Law & Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">19. Governing Law & Dispute Resolution</h2>
          <p className="leading-relaxed">
            These Terms are governed by the laws of Canada. Disputes are handled in Canadian courts.
          </p>
        </section>

        {/* 20. Platform Changes & Updates */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">20. Platform Changes & Updates</h2>
          <p className="leading-relaxed">
            Features and Terms may change as Tealives evolves. We will notify users of major changes
            in advance when possible.
          </p>
        </section>

        {/* 21. Accessibility & Feedback */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">21. Accessibility & Feedback</h2>
          <p className="leading-relaxed">
            We strive for an accessible experience. To report issues or suggest improvements, please
            visit our <a href="/feedback" className="text-blue-600 dark:text-blue-400 underline">Feedback page</a>.
          </p>
        </section>

        {/* 22. Contact */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">22. Contact</h2>
          <p className="leading-relaxed">
            Questions? Reach out at{' '}
            <strong className="text-blue-600 dark:text-blue-400">support@tealives.com</strong>.
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-6 text-center">
          By using Tealives, you help foster a kind, local-first community. 🌱
        </p>
      </div>
    </div>
  );
}

export default TermsPage;
