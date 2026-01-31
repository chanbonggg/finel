// src/lib/prisma.ts

// PrismaClient: 데이터베이스와 소통(CRUD)을 담당하는 핵심 도구입니다.
import { PrismaClient } from '@prisma/client';

// TypeScript에게 'globalThis'(전역 변수 공간)에 'prisma'라는 변수가 들어갈 수 있다고 알려주는 코드입니다.
// 이렇게 타입을 지정해주지 않으면 TypeScript가 "그런 변수 없는데?" 하고 에러를 냅니다.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// prisma 객체를 내보냅니다(export).
// 로직:
// 1. globalForPrisma.prisma(이미 만들어진 연결)가 있으면 그것을 재사용합니다.
// 2. 없다면(처음 실행되는 경우라면) new PrismaClient()를 실행해 새로 만듭니다.
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // 개발 중(log)에는 쿼리가 실행될 때마다 터미널에 로그를 보여줘서 디버깅을 돕습니다.
        log: ['query'],
    });

// 만약 현재 환경이 'production'(실제 배포 환경)이 아니라면,
// 방금 만든 prisma 객체를 전역 변수(globalForPrisma)에 저장해 둡니다.
// 이렇게 해야 다음번에 코드가 다시 로드될 때 새로 연결하지 않고 위에서 저장해둔 것을 꺼내 씁니다.
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;