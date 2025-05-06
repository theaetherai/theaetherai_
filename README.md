## License

This project is licensed for educational use only. For commercial use, a license must be purchased. You can obtain the license here: [Code License](https://webprodigies.com/license).

## Deployment on Vercel

### Prerequisites
- A Vercel account
- PostgreSQL database (we recommend using Vercel Postgres, Supabase, or Railway)
- Cloudinary account for media storage
- Clerk account for authentication
- Stripe account for payments (optional)

### Environment Variables
This project requires several environment variables. Create a `.env.local` file for local development using the example in `.env.example`. On Vercel, add these environment variables in the project settings.

Key environment variables include:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: For authentication
- Cloudinary credentials for file uploads
- OpenAI/GROQ API keys for AI features

### Deployment Steps
1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Set all required environment variables in Vercel
4. Deploy with the following build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install --legacy-peer-deps`
   - Output Directory: `.next`

### Common Issues and Solutions
- **Database connection errors**: Ensure your DATABASE_URL is correct and the IP address is whitelisted
- **Clerk authentication issues**: Make sure to set the correct Clerk environment variables including `CLERK_JWT_LEEWAY=60`
- **Build failures**: The project uses `--legacy-peer-deps` to resolve dependency conflicts

## Usage Guidelines

Here are a few examples of how you can and cannot use the code:

- **To learn?** ✅
- **To build a portfolio?** ✅
- **To get a job?** ✅
- **To run as a business?** ❌
- **To run as a SaaS?** ❌
- **Any form of income through the code?** ❌
- **To resell?** ❌
- **To create content?** ❌
- **To claim as your own?** ❌

These are just a few examples, and there may be more situations where the code usage is restricted you can read the agreement on the website.
This code is provided strictly for learning purposes. If you wish to use our code for any commercial purposes, please purchase a license here: [Code License](https://webprodigies.com/license).
