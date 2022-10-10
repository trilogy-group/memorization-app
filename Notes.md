## Notes

#### 1. Setup local mysql instance

#### 2. Copy .env file to repo directory
Contact zhiyuan.gao@trilogy for the .env file which contains credentials for demo

#### 3. npm i

#### 4. Create DB
Run this
```
npx prisma migrate dev --name init
```
Or
```
npx prisma db push --preview-feature
```
Check your mysql now, it should have the tables created.

#### 5. npm run dev

#### 6. open 127.0.0.1:3000
