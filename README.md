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
- AWS Account + Credentials
- Google Cloud Platform Account + Credentials

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

- In GCP, go to "API & Services" -> OAuth 2.0, add Authorized Javascript origins and Authorized redirect URIs in accordance to your production domain address

#### 5. Running the app

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

#### 6. For further details
See [SELF-HOSTING.md](/SELF-HOSTING.md)

## Deployment
Deployment is handled through CDK stack defined in [aws](./aws/) folder.
It's an application load balanced ECS service. 
Deployment is automated through CI/CD. By default the action is triggered only when there are changes on the master branch in the aws folder

To run the deployment manually, run

```bash
cd aws
pip install -r requirements.txt
cdk deploy --all --require-approval never
```

The publish action in the github workflows publishes a new version of the code each time a commit is pushed to master and updates the ECS service

#### 7. Build the docker 

The ECR repository is configured in `aws/stack/ecs_stack.py` named as "memoryapp". The ecs service will always point to the latest image of the mentioned repository.

To build and push the docker
```
cp scripts/build_image.sh .
sudo bash build_image.sh
```

#### 8. Traps and Pitfalls

1. ECS points to the docker image with the tag "latest" in ECR, every change in that certain image will be automatically reflected in the deployment. However, it takes 10~20 minutes to take on the effect.
2. During our development, we only used free credits from Dreamstudio and OpenAI. We do not have business plans for the service as for now.
3. Our development used private GCP accont. We do not have access to GCP company account.
4. We provided a database dump file along with the instructions. It has 5~10 posts that demonstrate our ideas.

