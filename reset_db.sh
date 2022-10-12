
rm -r prisma/migrations
npm uninstall prisma
npm install prisma

#npx prisma migrate dev --name init
npx prisma db push --preview-feature --schema prisma/schema.prisma
