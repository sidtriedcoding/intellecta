This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Before running the project, you need to set up your environment variables. Create a `.env.local` file in the root directory with the following variables:

```bash
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Model Configuration (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_api_key

# WXFlows Configuration
WXFLOWS_ENDPOINT=your_wxflows_endpoint
WXFLOWS_API_KEY=your_wxflows_api_key
```

### Getting the Required Keys

1. **Convex**: 
   - Sign up at [Convex](https://www.convex.dev)
   - Create a new project
   - Copy the deployment URL from your project settings

2. **Clerk**:
   - Sign up at [Clerk](https://clerk.dev)
   - Create a new application
   - Get your publishable key from the API Keys section

3. **Anthropic**:
   - Sign up at [Anthropic](https://www.anthropic.com)
   - Get your API key from the API Keys section

4. **WXFlows**:
   - Contact your WXFlows administrator for the endpoint and API key

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
