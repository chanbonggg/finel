// prisma/seed.js

require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    // 1. 환경변수에서 비밀번호 가져오기 (없으면 기본값 '1234')
    const password = process.env.ADMIN_PASSWORD || '1234'

    // 2. 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. 관리자 계정 생성 또는 업데이트
    const admin = await prisma.admin.upsert({
        where: { username: 'admin' },
        // update: 이미 'admin'이 존재하면 비밀번호를 새 것으로 갱신함
        update: {
            password: hashedPassword,
        },
        // create: 'admin'이 없으면 새로 만듬
        create: {
            username: 'admin',
            password: hashedPassword,
        },
    })

    console.log('관리자 계정 세팅 완료!')
    console.log(`ID: admin`)
    console.log(`PW: ${password} (환경변수 적용됨)`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })