This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## S3 / Upload proof setup

The registration proof upload endpoint is `POST /api/registrations/upload-proof` and expects `multipart/form-data` with a `file` field.

Set these environment variables (in `.env.local`):

- `S3_REGION`
- `S3_ENDPOINT` (AWS: `https://s3.<region>.amazonaws.com`, DigitalOcean Spaces: `https://<region>.digitaloceanspaces.com`)
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL` (used to build the returned public URL; e.g. `https://<bucket>.<region>.digitaloceanspaces.com`)

Optional:

- `S3_FORCE_PATH_STYLE=true` (sometimes needed for S3-compatible providers)
- `S3_DEBUG=true` (enables verbose server logs)

### Public uploads

This project tries to make uploaded objects **public** by sending `ACL: public-read` on upload.

Some providers / bucket configurations disable ACLs (for example, AWS S3 with **Object Ownership = "Bucket owner enforced"**). In that case, the upload will automatically retry **without** ACL.

If your provider rejects ACLs, set:

- `S3_DISABLE_ACL=true`

If you want to explicitly control whether ACL is sent, set:

- `S3_ENABLE_ACL=true` (force sending `ACL: public-read`)
- `S3_ENABLE_ACL=false` (never send ACL)

### If you see "AccessDenied"

Most commonly this happens because your bucket requires a **bucket policy** for public reads.

For public URLs to work without ACLs, configure your bucket/space as public (or add a read-only bucket policy for the `registrations/*` prefix).
