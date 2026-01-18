# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Supabase CLI Setup

For local development with Supabase edge functions and database migrations, you'll need the Supabase CLI.

### Installation

The Supabase CLI is installed as a dev dependency in this project. Use `npx` to run commands:

```sh
# Install dependencies (includes Supabase CLI)
npm install
```

### Authentication & Project Linking

```sh
# One-time setup: Login to Supabase
npx supabase login

# Link to your Supabase project
npx supabase link --project-ref vuffzfuklzzcnfnubtzx
```

### Edge Functions Deployment

Edge functions deploy automatically in Lovable. For local development:

```sh
# Deploy a specific function
npx supabase functions deploy create-order

# Deploy all functions
npx supabase functions deploy
```

View your deployed functions in the [Supabase Dashboard](https://supabase.com/dashboard/project/vuffzfuklzzcnfnubtzx/functions).

### Database Migrations

```sh
# Apply new migrations to your database
npx supabase db push
```

### Environment Variables

For local development, create a `.env.local` file (already in `.gitignore`) for any local-only variables.

### Bidirectional Sync

If you keep Lovable connected to the same GitHub repo, changes you push from local development will sync back to Lovable automatically, and vice versa. This means you can use both tools interchangeably!

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
