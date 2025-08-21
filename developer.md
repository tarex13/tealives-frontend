# Developer Notes (Tealives)

## 🛠 Tech Stack
- **Frontend:** React + TailwindCSS (deployed on Vercel)
- **Backend:** Django REST Framework (deployed on Render)
- **Database:** PostgreSQL (via Supabase)
- **Storage:** Supabase for media and assets
- **Real-time Features:** Django Channels + Redis (chat & notifications)
- **Auth:** JWT-based authentication with refresh token support

---

## ⚡ Real-Time Chat (Highlight Feature)
The most technically challenging and rewarding feature:
- Built on **Django Channels** with **Redis** pub/sub
- **Marketplace-aware chat**: sellers can mark items as sold inside the chat, with contextual item highlights (name, price, view link)
- **Typing indicators** (only after first message, for privacy)
- **File attachments & link previews**
- **Asynchronous messaging**, optimized for responsiveness
- **Real-time notifications** (even if a user is outside the chat view)

---

## 🗄 Backend Architecture
- Over **110 API endpoints** covering posts, marketplace, events, groups, and businesses
- Django models and migrations fully manage the PostgreSQL schema
- Cleanly separated layers: **urls → views → serializers → models**
- Polls, RSVPs, reviews, and business analytics all powered through REST APIs

---

## 🔄 API Overview

High-level endpoints available (non-exhaustive):
- **Auth**
  - `/api/auth/login/`
  - `/api/auth/refresh/`
- **Posts**
  - `/api/posts/` (discussions, rants, polls, questions)
  - `/api/posts/{id}/comments/`
- **Marketplace**
  - `/api/marketplace/`
  - `/api/marketplace/{id}/chat/`
- **Events**
  - `/api/events/`
  - `/api/events/{id}/rsvp/`
- **Groups**
  - `/api/groups/`
  - `/api/groups/{id}/members/`
- **Businesses**
  - `/api/businesses/`
  - `/api/businesses/{id}/analytics/`

---

## 💡 Development Notes
- Used **Docker locally** for running Redis during development
- Backend was the **heaviest challenge**, with multiple interdependent apps and large serializers
- The project was partially AI-assisted for boilerplate/troubleshooting, but **core logic and features were hand-built**

---

## 🚀 Deployment
- **Frontend:** Vercel (React SPA with Tailwind)
- **Backend:** Render (Django REST API + Channels)
- **Database & Storage:** Supabase (Postgres + file storage)

---

## 🔮 Future Roadmap
- Job board and rideshare integrations
- Expansion of marketplace with advanced filtering
- More business-focused tools (better analytics, targeted promotions)
