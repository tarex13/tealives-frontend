// src/pages/PrivacyPolicy.jsx
import React from 'react';

function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-extrabold mb-2 text-center">
        🔒 Privacy Policy
      </h1>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-10 italic">
        Effective June 27, 2025 – Tealives
      </p>

      <div className="space-y-10">

        {/* 1. Introduction & Scope */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introduction & Scope</h2>
          <p className="leading-relaxed">
            This Privacy Policy explains how Tealives (“we,” “us,” “our”) collects, uses,
            discloses, and protects your personal information when you use our website,
            mobile apps, and related services (collectively, “Tealives”). By using Tealives,
            you agree to the practices described herein.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>
              <strong>User-Provided Information:</strong> when you register or update your
              profile, we collect data such as your username, email address, password,
              date of birth, phone number, city, business information (if applicable),
              profile image, bio, display name, gender, social links, language preference,
              and other fields you choose to provide.
            </li>
            <li>
              <strong>Automatic Information:</strong> we determine your city via a lookup
              to <code>ipwho.is</code>; we store only the resolved city and country, not
              your IP address or network provider. We also collect in-house aggregate
              analytics (e.g., number of posts, feature usage) to improve the service.
            </li>
            <li>
              <strong>Cookies & Session Data:</strong> essential cookies (e.g., JWT refresh
              tokens, CSRF/session cookies) are used to power authentication and security.
              We do not use analytics or tracking cookies.
            </li>
          </ul>
        </section>

        {/* 3. How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li><strong>Authentication & Security:</strong> to create and protect your account.</li>
            <li><strong>Personalization:</strong> to deliver city-specific feeds and content recommendations.</li>
            <li><strong>Notifications & Messaging:</strong> to send you alerts, mentions, and messages.</li>
            <li><strong>In-House Analytics:</strong> to monitor feature usage and improve Tealives.</li>
          </ul>
        </section>

        {/* 4. Cookies & Similar Technologies */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Cookies & Similar Technologies</h2>
          <p className="leading-relaxed">
            We use only essential cookies—specifically JWT refresh tokens and CSRF/session
            cookies—for authentication and security. These cookies persist according to
            your browser or logout actions. We do not deploy analytics or tracking cookies,
            nor do we embed third-party scripts that set cookies.
          </p>
        </section>

        {/* 5. Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
          <p className="leading-relaxed">
            We retain your personal information and Content for at least 30 days after you
            deactivate your account. After this period, we permanently erase your data.
            Currently, we do not maintain separate backups.
          </p>
        </section>

        {/* 6. Data Sharing & Third-Parties */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Data Sharing & Third-Parties</h2>
          <p className="leading-relaxed">
            We do not share your personal data with third parties for marketing or analytics.
            The only external call is to <code>ipwho.is</code> to resolve your city; we do not
            store IP addresses or other lookup results. All email and data handling is done in-house.
          </p>
        </section>

        {/* 7. Your Rights & Controls */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Your Rights & Controls</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li><strong>Access & Update:</strong> you can view and edit your profile data in settings.</li>
            <li><strong>Deactivate:</strong> you may deactivate your account at any time (30-day retention).</li>
            <li><strong>Export:</strong> upon request, email <strong>support@tealives.com</strong> to obtain your data.</li>
            <li><strong>Deletion:</strong> full deletion is not yet supported beyond deactivation.</li>
          </ul>
        </section>

        {/* 8. Security Measures */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Security Measures</h2>
          <ul className="list-disc pl-6 space-y-2 text-base">
            <li>All data in transit is encrypted with TLS (HTTPS).</li>
            <li>Passwords are hashed with Argon2 before storage.</li>
            <li>Admins and developers may access raw data for support and maintenance.</li>
            <li>We do not yet have a formal breach notification process in place.</li>
          </ul>
        </section>

        {/* 9. Children’s Privacy */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Children’s Privacy</h2>
          <p className="leading-relaxed">
            Tealives does not knowingly collect personal information from anyone under 13.
            If we learn a user is under 13, we will delete the account.
          </p>
        </section>

        {/* 10. International Transfers & Compliance */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">10. International Transfers & Compliance</h2>
          <p className="leading-relaxed">
            While we operate under Canadian law, our database subscription is hosted in the United States.
            Your data is therefore stored on U.S. servers and subject to U.S. legal requirements. We
            have implemented contractual safeguards to comply with Canadian privacy obligations when
            transferring data across borders.
          </p>
        </section>

        {/* 11. Changes to This Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">11. Changes to This Policy</h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy as Tealives evolves. Major changes will be
            communicated via email to registered users.
          </p>
        </section>

        {/* 12. Contact Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-3">12. Contact Us</h2>
          <p className="leading-relaxed">
            For questions about this policy or your data, contact us at{' '}
            <strong className="text-blue-600 dark:text-blue-400">privacy@tealives.com</strong>.
          </p>
        </section>

      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
