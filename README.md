<h1 align="center" style="font-size: 60px">Memoryapp</h1>

<p align="center"><strong>Developed based on napthedev's open source project [Tiktok clone](https://github.com/napthedev/toptop-clone)</strong></p>

## Live demo

Demo website: [https://toptop-clone.vercel.app/](https://toptop-clone.vercel.app/)

## Main technology used

- The t3 stack: [create.t3.gg](https://create.t3.gg/)
  - Nextjs
  - Prisma
  - trpc
  - Typescript
  - Tailwind
- next-auth
- react-hot-toast

## Features

- Auth (Google, Facebook)
- Upload video with thumbnail
- Infinite loading
- Follow user
- Following tab
- Like a video
- Comment on a video
- Share video on Facebook, Twitter, Reddit,...
- User profile
- Search accounts and videos
- SEO

## Installation

#### 1. nvm install --lts && npm i
#### 2. Install mysql
Then execute `CREATE DATABASE memoryapp`
#### 3. Get credentials
Log in to AWS console, get [.env from s3](https://s3.console.aws.amazon.com/s3/upload/tu2k22-memoryapp)

Change `DATABASE_URL` to `DATABASE_URL=mysql://yourmysqldbadminname:password@127.0.0.1:3306/memoryapp`
`memoryapp` is the database name.

#### 4. npx prisma migrate dev --name init
#### 5. npm run dev

#### For further details
See [SELF-HOSTING.md](/SELF-HOSTING.md)
