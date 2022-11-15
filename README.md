<h1 align="center" style="font-size: 60px">Memoryapp</h1>

<p align="center"><strong>Developed based on napthedev's open source project [Tiktok clone](https://github.com/napthedev/toptop-clone)</strong></p>

## Live demo

Demo website: [https://memoryapp.tu2k22.devfactory.com/](https://memoryapp.tu2k22.devfactory.com/)
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

- Auth (Google)
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

## Development Set-up

#### 1. Prerequisites
- Python v3.7+
- [Install nvm](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/) then run
```bash
nvm install --lts
```
#### 2. Install mysql
- Create a mysql db user with all privileges
- Then execute `CREATE DATABASE memoryapp`
#### 3. Populate DB
- run the following script to get Concepts from the Curriculum Graph
```bash
bash scripts/get_concepts/sh > data.txt
```
- Open [db population script](./scripts/loadConcepts.py)
- edit the username and password to your username and password
- run the following command
```bash
bash scripts/loadConcepts.py
```
#### 4. Get environment variables
- Log in to aws console in the TrilogyUniversity Account (Account Id: 280022023954)
- Get [.env file from s3](https://s3.console.aws.amazon.com/s3/upload/tu2k22-memoryapp)
- Change `DATABASE_URL` in .env to `DATABASE_URL=mysql://yourmysqldbadminname:password@127.0.0.1:3306/memoryapp`
`memoryapp` is the database name.

#### 5. Running the app

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

#### 6. For further details
See [SELF-HOSTING.md](/SELF-HOSTING.md)
