#!/bin/sh
npx prisma generate
npx prisma migrate deploy
exec npm start
