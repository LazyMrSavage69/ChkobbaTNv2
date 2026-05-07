# Tunisian Card Game

A full-stack multiplayer card game built with Next.js 15, Supabase, and Framer Motion. Features a traditional Tunisian 40-card deck with authentic café atmosphere.

## Features

- **Tunisian 40-Card Deck**: Custom deck with Coupe, Carreau, Trèfle, and Pique suits
- **Real-time Multiplayer**: Supabase Realtime for live game updates
- **Tunisian Aesthetic**: Zellige patterns, arabesque borders, chicha decorations
- **Animated Gameplay**: Hand animations, card flips, smoke particles
- **Authentication**: Username/password auth with auto-confirmation
- **Game Modes**: Plugin architecture for easy mode expansion
- **Leaderboard**: Track wins, losses, and scores

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd tunisian-card-game
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > Database** and run the migration:
   ```bash
   npx supabase migration up
   # Or copy contents of supabase/migrations/001_initial_schema.sql into SQL Editor
   ```
3. **Disable Email Confirmation** (Critical for username-only auth):
   - Go to **Authentication > Providers > Email**
   - Turn OFF **"Confirm email"** toggle
   - This allows immediate login after signup without email verification
4. Copy your Supabase URL and Anon Key from **Project Settings > API**

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Game Architecture

### Card System
- 40-card Tunisian deck (values 1-10, 4 suits)
- Located in `lib/game-engine/deck.ts`

### Game Modes
- Plugin architecture: implement `GameMode` interface
- Normal Mode: `lib/game-engine/modes/normal-mode.ts`
- Register new modes in `lib/game-engine/mode-registry.ts`

### State Machine
- `lib/game-engine/state-machine.ts` manages game phases:
  - `waiting` → `playing` → `round_end` → `game_over`

### Realtime
- Supabase Realtime channels for:
  - Room list updates (Lobby)
  - Player join/leave (Waiting Room)
  - Card plays and turn changes (Game Table)

## Project Structure

```
tunisian-card-game/
├── app/
│   ├── api/
│   │   └── game/
│   │       ├── move/route.ts
│   │       └── start/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── lobby/page.tsx
│   ├── leaderboard/page.tsx
│   ├── profile/page.tsx
│   ├── game/[roomId]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── auth/AuthProvider.tsx
│   ├── ui/Navbar.tsx
│   ├── game/
│   │   ├── PlayingCard.tsx
│   │   ├── GameTable.tsx
│   │   ├── PlayerAvatar.tsx
│   │   ├── PlayerHand.tsx
│   │   └── CenterPile.tsx
│   ├── lobby/RoomCard.tsx
│   ├── leaderboard/LeaderboardRow.tsx
│   └── svg/
│       ├── ZelligePattern.tsx
│       ├── ArabesqueBorder.tsx
│       ├── Chicha.tsx
│       ├── Cigarette.tsx
│       ├── HandAnimation.tsx
│       ├── Lantern.tsx
│       └── CardBack.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── game-engine/
│   │   ├── deck.ts
│   │   ├── state-machine.ts
│   │   ├── mode-registry.ts
│   │   └── modes/normal-mode.ts
│   ├── hooks/useRealtime.ts
│   └── utils/cn.ts
├── types/index.ts
├── supabase/migrations/001_initial_schema.sql
├── middleware.ts
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## Customization

### Adding a New Game Mode

1. Create `lib/game-engine/modes/your-mode.ts`
2. Implement the `GameMode` interface
3. Register in `lib/game-engine/mode-registry.ts`:
   ```ts
   import { YourMode } from "./modes/your-mode";
   registerGameMode("yourmode", YourMode);
   ```

### Modifying Colors

Edit CSS variables in `app/globals.css` and `tailwind.config.ts`:
```css
--red-deep: #8B1A1A;
--gold: #C9A84C;
--green-dark: #1A4A2E;
--cream: #F5ECD7;
--brown-dark: #2C1810;
```

## License

MIT
gger runs **before** insert on `auth.users`
- It sets `email_confirmed_at = NOW()` and `confirmed_at = NOW()`
- The user can login immediately without checking any email

### Alternative: Dashboard Setting
If you prefer not to use the database trigger, you can also disable email confirmation in the Supabase Dashboard:
1. Go to **Authentication > Providers > Email**
2. Turn OFF **"Confirm email"** toggle
3. This achieves the same result via the UI

### For Self-Hosted Supabase:
Set in your `docker-compose.yml` or `config.toml`:
```toml
[auth.email]
enable_confirmations = false
```

Or set the environment variable:
```env
GOTRUE_MAILER_AUTOCONFIRM=true
```
# ChkobbaTNv2
