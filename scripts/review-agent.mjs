#!/usr/bin/env node
/**
 * review-agent.mjs
 *
 * 코드 리뷰 에이전트 — finel 프로젝트 전용
 *
 * 사용법:
 *   node scripts/review-agent.mjs              # 전체 src/ 검사
 *   node scripts/review-agent.mjs --diff       # git diff 기준 변경 파일만 검사
 *   node scripts/review-agent.mjs src/app/api  # 특정 경로만 검사
 *
 * 검사 항목:
 *   [H] 보안 — 인증 누락, XSS, NaN ID, 로그아웃 메서드
 *   [M] 품질 — 이중 쿼리, Prisma 로그, 낙관적 UI, 검사 일관성
 *   [L] 스타일 — any 타입, 중복 코드, 불필요 패턴
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, relative, extname } from 'path';

// ─── 색상 출력 ────────────────────────────────────────────────────────────────
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

// ─── 규칙 정의 ────────────────────────────────────────────────────────────────
/** @type {Array<{id: string, level: 'HIGH'|'MEDIUM'|'LOW', title: string, test: (code: string, file: string) => string[]}>} */
const RULES = [

  // ── HIGH ──────────────────────────────────────────────────────────────────

  {
    id: 'H1',
    level: 'HIGH',
    title: '이메일 HTML에 사용자 입력 미이스케이프 (XSS)',
    test(code, file) {
      if (!file.includes('inquiries')) return [];
      // 템플릿 리터럴 안에 html: `` 패턴이 있고 ${...} 변수가 escapeHtml 없이 삽입될 때
      const hasRawHtml = /html:\s*`[\s\S]*?\$\{(?!escapeHtml)[a-zA-Z]/.test(code);
      return hasRawHtml
        ? ['이메일 html 템플릿에 사용자 입력이 비가공 상태로 삽입됩니다. escapeHtml() 처리 필요.']
        : [];
    },
  },

  {
    id: 'H2',
    level: 'HIGH',
    title: '문의 GET — 관리자 인증 없이 전체 고객 정보 노출',
    test(code, file) {
      if (!file.includes('inquiries/route')) return [];
      const hasGet = /export async function GET/.test(code);
      const hasAuth = /requireAdmin/.test(code);
      if (hasGet && !hasAuth) {
        return ['GET /api/inquiries에 requireAdmin 인증이 없습니다. 고객 개인정보가 누구에게나 노출됩니다.'];
      }
      return [];
    },
  },

  {
    id: 'H3',
    level: 'HIGH',
    title: '제품/카테고리 변경 API — 인증 없음',
    test(code, file) {
      const isProductOrCategory =
        file.includes('api/products') || file.includes('api/categories');
      if (!isProductOrCategory) return [];

      const issues = [];
      const methods = ['POST', 'PATCH', 'DELETE'];
      for (const method of methods) {
        const methodRegex = new RegExp(`export async function ${method}[\\s\\S]{0,500}?requireAdmin`, 'm');
        const hasMethod = new RegExp(`export async function ${method}`).test(code);
        if (hasMethod && !methodRegex.test(code)) {
          issues.push(`${method} 핸들러에 requireAdmin 인증이 없습니다. 누구나 호출 가능합니다.`);
        }
      }
      return issues;
    },
  },

  {
    id: 'H4',
    level: 'HIGH',
    title: '로그아웃 GET 메서드 — CSRF 취약점',
    test(code, file) {
      if (!file.includes('logout')) return [];
      if (/export async function GET/.test(code)) {
        return ['로그아웃이 GET 메서드입니다. <img src="/api/auth/logout"> 하나로 강제 로그아웃 가능. POST로 변경하세요.'];
      }
      return [];
    },
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    id: 'M1',
    level: 'MEDIUM',
    title: 'parseInt/Number 결과에 isNaN 검사 누락',
    test(code, file) {
      if (!file.includes('api/')) return [];
      const issues = [];
      // params에서 id를 parseInt/Number 하는데 isNaN 체크가 없는 패턴 탐지
      const parseIntMatch = code.match(/parseInt\(([^)]+)\)/g) || [];
      const numberMatch   = code.match(/Number\(([^)]+)\)/g) || [];
      const allConverts   = [...parseIntMatch, ...numberMatch];

      for (const convert of allConverts) {
        // isNaN이 파일 내 어딘가에 있으면 pass (간단 휴리스틱)
        if (!code.includes('isNaN')) {
          issues.push(`${convert} — 변환 후 isNaN() 검사가 없습니다. NaN이 Prisma에 전달되면 500 에러가 발생합니다.`);
          break; // 파일당 한 번만 보고
        }
      }
      return issues;
    },
  },

  {
    id: 'M2',
    level: 'MEDIUM',
    title: 'Prisma create 후 findUnique 이중 쿼리',
    test(code, file) {
      if (!file.includes('api/products')) return [];
      if (/prisma\.\w+\.create\([\s\S]*?\)/.test(code) && /prisma\.\w+\.findUnique\(/.test(code)) {
        return ['create 이후 즉시 findUnique를 호출합니다. create 시 include를 사용하면 쿼리 하나로 줄일 수 있습니다.'];
      }
      return [];
    },
  },

  {
    id: 'M3',
    level: 'MEDIUM',
    title: 'Prisma 쿼리 로그가 프로덕션에서도 출력됨',
    test(code, file) {
      if (!file.includes('prisma.ts')) return [];
      if (/log:\s*\[['"]query['"]\]/.test(code) && !code.includes('NODE_ENV')) {
        return ["log: ['query']가 프로덕션에서도 활성화됩니다. NODE_ENV로 분기하세요."];
      }
      return [];
    },
  },

  {
    id: 'M4',
    level: 'MEDIUM',
    title: 'handleDelete — 응답 확인 없이 낙관적 UI 업데이트',
    test(code, file) {
      if (!file.includes('useProductAdmin')) return [];
      // DELETE fetch 후 바로 setProducts filter — res.ok 확인 없음
      const deleteBlock = code.match(/handleDelete[\s\S]{0,400}?setProducts/);
      if (deleteBlock && !/res\.ok/.test(deleteBlock[0])) {
        return ['handleDelete가 API 응답을 확인하지 않고 바로 로컬 상태에서 제품을 제거합니다. 삭제 실패 시 UI가 실제와 불일치합니다.'];
      }
      return [];
    },
  },

  {
    id: 'M5',
    level: 'MEDIUM',
    title: 'API 라우트 간 유효성 검사 방식 불일치',
    test(code, file) {
      if (!file.match(/api\/products\/route/)) return [];
      const hasPost = /export async function POST/.test(code);
      const hasZod  = /\.parse\(body\)/.test(code);
      if (hasPost && !hasZod) {
        return ['POST 핸들러가 수동 if 검사를 사용합니다. PATCH처럼 Zod 스키마로 통일하세요.'];
      }
      return [];
    },
  },

  // ── LOW ──────────────────────────────────────────────────────────────────

  {
    id: 'L1',
    level: 'LOW',
    title: 'Zod 스키마에 .optional() + .partial() 중복',
    test(code) {
      if (/\.optional\(\)[\s\S]{0,300}?\.partial\(\)/.test(code)) {
        return ['모든 필드가 이미 .optional()인 스키마에 .partial()을 추가로 호출하고 있습니다. .partial()을 제거하세요.'];
      }
      return [];
    },
  },

  {
    id: 'L2',
    level: 'LOW',
    title: 'isAdminPayload — 취약한 타입 가드 heuristic',
    test(code, file) {
      if (!file.includes('admin-auth')) return [];
      if (/typeof.*?\.status.*?!==.*?'number'/.test(code)) {
        return ['status 속성 존재 여부로 타입을 구분합니다. instanceof NextResponse가 더 명확하고 안전합니다.'];
      }
      return [];
    },
  },

  {
    id: 'L3',
    level: 'LOW',
    title: 'TypeScript any 사용',
    test(code, file) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return [];
      const matches = code.match(/:\s*any\b|as\s+any\b/g) || [];
      if (matches.length > 0) {
        return [`any 타입이 ${matches.length}회 사용됩니다. 구체적인 타입으로 교체하세요.`];
      }
      return [];
    },
  },
];

// ─── 파일 수집 ────────────────────────────────────────────────────────────────

function collectFiles(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('.') || entry === 'node_modules') continue;
      const full = `${dir}/${entry}`;
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...collectFiles(full));
      } else if (['.ts', '.tsx', '.mjs', '.js'].includes(extname(entry))) {
        results.push(full);
      }
    }
  } catch { /* ignore unreadable dirs */ }
  return results;
}

function getChangedFiles(root) {
  try {
    const out = execSync('git diff --name-only HEAD', { cwd: root, encoding: 'utf8' });
    const staged = execSync('git diff --cached --name-only HEAD', { cwd: root, encoding: 'utf8' });
    return [...new Set([...out.split('\n'), ...staged.split('\n')])]
      .map(f => f.trim())
      .filter(f => f && ['.ts', '.tsx', '.mjs', '.js'].some(ext => f.endsWith(ext)))
      .map(f => resolve(root, f));
  } catch {
    return [];
  }
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

function main() {
  const root = resolve(new URL('.', import.meta.url).pathname, '..');
  const args = process.argv.slice(2);
  const diffMode = args.includes('--diff');
  const targetArg = args.find(a => !a.startsWith('--'));

  let files;
  if (diffMode) {
    files = getChangedFiles(root);
    if (files.length === 0) {
      console.log(`${CYAN}변경된 파일이 없습니다.${RESET}`);
      process.exit(0);
    }
    console.log(`${CYAN}검사 모드: git diff (${files.length}개 파일)${RESET}\n`);
  } else if (targetArg) {
    const targetPath = resolve(root, targetArg);
    const stat = statSync(targetPath);
    files = stat.isDirectory() ? collectFiles(targetPath) : [targetPath];
    console.log(`${CYAN}검사 경로: ${targetArg} (${files.length}개 파일)${RESET}\n`);
  } else {
    files = collectFiles(resolve(root, 'src'));
    console.log(`${CYAN}검사 모드: 전체 src/ (${files.length}개 파일)${RESET}\n`);
  }

  /** @type {Map<string, Array<{rule: typeof RULES[0], messages: string[]}>>} */
  const reportByFile = new Map();
  let totalHigh = 0, totalMedium = 0, totalLow = 0;

  for (const file of files) {
    let code;
    try { code = readFileSync(file, 'utf8'); } catch { continue; }

    const relFile = relative(root, file);
    const fileIssues = [];

    for (const rule of RULES) {
      const messages = rule.test(code, relFile);
      if (messages.length > 0) {
        fileIssues.push({ rule, messages });
        if (rule.level === 'HIGH')   totalHigh++;
        if (rule.level === 'MEDIUM') totalMedium++;
        if (rule.level === 'LOW')    totalLow++;
      }
    }

    if (fileIssues.length > 0) {
      reportByFile.set(relFile, fileIssues);
    }
  }

  // ── 출력 ──────────────────────────────────────────────────────────────────

  console.log(`${BOLD}════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  finel 코드 리뷰 에이전트 결과${RESET}`);
  console.log(`${BOLD}════════════════════════════════════════════════════════${RESET}\n`);

  if (reportByFile.size === 0) {
    console.log(`${GREEN}✓ 검사된 모든 파일에서 이슈가 발견되지 않았습니다.${RESET}\n`);
  } else {
    for (const [file, issues] of reportByFile) {
      console.log(`${BOLD}${CYAN}📄 ${file}${RESET}`);
      for (const { rule, messages } of issues) {
        const levelColor = rule.level === 'HIGH' ? RED : rule.level === 'MEDIUM' ? YELLOW : GREEN;
        const badge = `${levelColor}${BOLD}[${rule.id} ${rule.level}]${RESET}`;
        console.log(`  ${badge} ${rule.title}`);
        for (const msg of messages) {
          console.log(`    → ${msg}`);
        }
      }
      console.log();
    }
  }

  // ── 요약 ──────────────────────────────────────────────────────────────────
  console.log(`${BOLD}════════════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  검사 요약${RESET}`);
  console.log(`${BOLD}════════════════════════════════════════════════════════${RESET}`);
  console.log(`  파일 검사: ${files.length}개`);
  console.log(`  이슈 파일: ${reportByFile.size}개`);
  console.log(`  ${RED}${BOLD}HIGH   : ${totalHigh}개${RESET}`);
  console.log(`  ${YELLOW}${BOLD}MEDIUM : ${totalMedium}개${RESET}`);
  console.log(`  ${GREEN}${BOLD}LOW    : ${totalLow}개${RESET}`);
  console.log();

  if (totalHigh > 0) {
    console.log(`${RED}${BOLD}⛔  HIGH 이슈가 있습니다. 머지 전에 반드시 수정하세요.${RESET}\n`);
    process.exit(1); // CI에서 실패로 처리
  } else if (totalMedium > 0) {
    console.log(`${YELLOW}${BOLD}⚠   MEDIUM 이슈가 있습니다. 빠른 시일 내에 수정하세요.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`${GREEN}${BOLD}✓  심각한 이슈 없음.${RESET}\n`);
    process.exit(0);
  }
}

main();
