# Hunger Games LLM Simulator - Analysis & Architecture

## 1. Project Overview
A web-based Hunger Games simulator where game events are procedurally determined by the system but the narrative text is generated dynamically by an LLM for maximum variety. The tone should be immersive, acting as a "Game Orchestrator," with a flavorful UI that departs from standard, boring components.

## 2. Tech Stack Requirements
- **Framework**: Next.js (Full-stack React)
- **Database**: PostgreSQL (e.g., Supabase/Neon) - robust for token transactions and relational game states
- **LLM Routing**: Vercel AI SDK + OpenRouter - Best for Next.js streaming and single API access to multiple LLMs.
- **Styling**: Tailwind CSS + GSAP + Shadcn UI - For a rich, animated "Game Orchestrator" aesthetic.
- **Hosting**: Vercel (Optimal edge hosting for Next.js)
- **Authentication/Authz**: Supabase Auth (Seamless integration with DB) + Stripe (Payments)

## 3. Core Mechanics & Architecture
- **Event Engine**: Data-Driven JSON Templates in Supabase. The system randomly pulls event combinations (e.g., `{"type": "1v1", "outcome": "t1_kills_t2"}`) and pre-determines outcomes. The LLM does *not* decide who wins or loses.
- **Narrative Engine**: The LLM takes the context (tributes involved, the fixed outcome, location, current timeline) and generates immersive flavor text. We will use a Day-by-Day (or Phase-by-Phase) generation pacing, meaning all events for 'Day 1' are generated in parallel/batch before the user reads through them, ensuring a balance between loading times and interactivity.
- **State Management**:
  - **Guests**: Local storage / Session-based (limited to 1 game).
  - **Registered Users**: DB-backed, persistent game histories, full functionality.
- **Monetization / Limits**: Token/pass system to limit LLM API usage. Registered users consume tokens per generation.
- **Localization**: Multi-language support (i18n) from the ground up.

## 4. Security & Compliance
- Standard authentication for user profiles.
- Secure payment gateway integration for purchasing tokens/passes.
- No highly sensitive data beyond standard auth/payments.

## 5. Future Roadmap (Out of Scope for MVP)
- **Media Generation**: Hooking into image, video, and TTS models for richer event descriptions.
- **Social/Interactive**: Spectator mode and a betting system using virtual currency.
- **Dynamic World-building**: Map generator that changes over time based on the timeline, tribute locations, and global events.

## 6. Resolved Decisions (From /grill-me session)
- **DBMS & Backend**: Supabase (PostgreSQL + Auth + Storage).
- **Hosting**: Vercel.
- **LLM Routing**: Vercel AI SDK + OpenRouter.
- **Styling**: Tailwind CSS + GSAP + Shadcn UI.
- **Event Management**: Data-Driven JSON Templates stored in Supabase.
- **Generation Flow**: Day-by-Day (Phase-by-Phase) batched generation.
