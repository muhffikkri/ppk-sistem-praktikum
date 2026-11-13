/**
 * UI token guard (docs/ui-overhaul-plan.md §6.6).
 *
 * Usage:
 *   npm run check:ui                      # scan src/**, exit 1 on violations
 *   npm run check:ui -- <path|glob> ...   # scan only the given files/dirs/globs
 *   npm run check:ui -- --report          # print a per-file count, never exit 1
 *
 * Rules (checked on the TypeScript AST, so comments never trigger them):
 *   color      hex / rgba() string literals outside src/theme/**
 *   typography fontSize / fontFamily / fontWeight / fontStyle style keys
 *              outside src/theme/** and src/shared/ui/**
 *   rn-text    `Text` imported from 'react-native' in src/features/** and src/app/**
 *   copy       banned out-of-scope copy (QR, Beacon, Shift, SIAKAD, ...) in
 *              string literals and JSX text anywhere in src/**
 */
import { existsSync, globSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

type Rule = 'color' | 'typography' | 'rn-text' | 'copy';
type Violation = { file: string; line: number; rule: Rule; detail: string };

const root = process.cwd();
const args = process.argv.slice(2);
const reportOnly = args.includes('--report');
const targets = args.filter((arg) => !arg.startsWith('--'));

const SOURCE_EXT = /\.(ts|tsx)$/;
const COLOR = /#[0-9A-Fa-f]{3,8}\b|rgba?\(/;
const TYPO_KEYS = new Set([
  'fontSize',
  'fontFamily',
  'fontWeight',
  'fontStyle',
]);
const BANNED =
  /\b(QR|Beacon|Geofence|Shift|SIAKAD|SSO|Bench|Meja)\b|\bdummy\b/i;

const toPosix = (file: string) =>
  path.relative(root, file).split(path.sep).join('/');
const inTheme = (file: string) => file.startsWith('src/theme/');
const inSharedUi = (file: string) => file.startsWith('src/shared/ui/');
const inScreens = (file: string) =>
  file.startsWith('src/features/') || file.startsWith('src/app/');

function collectFiles(patterns: string[]): string[] {
  const files = new Set<string>();
  for (const pattern of patterns.length ? patterns : ['src/**']) {
    const matches =
      existsSync(pattern) && statSync(pattern).isDirectory()
        ? globSync(`${pattern.replace(/[\\/]+$/, '')}/**/*`)
        : globSync(pattern);
    for (const match of matches) {
      const file = toPosix(path.resolve(root, match));
      if (SOURCE_EXT.test(file) && statSync(match).isFile()) files.add(file);
    }
  }
  return [...files].sort();
}

function checkFile(file: string): Violation[] {
  const text = readFileSync(path.join(root, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const violations: Violation[] = [];
  const report = (node: ts.Node, rule: Rule, detail: string) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    violations.push({ file, line: line + 1, rule, detail });
  };

  const visit = (node: ts.Node) => {
    const literal =
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
        ? node.text
        : ts.isJsxText(node)
          ? node.getText()
          : null;

    if (literal !== null) {
      if (!inTheme(file) && COLOR.test(literal)) {
        report(node, 'color', literal);
      }
      const banned = literal.match(BANNED);
      if (banned) report(node, 'copy', banned[0]);
    }

    if (
      !inTheme(file) &&
      !inSharedUi(file) &&
      ts.isPropertyAssignment(node) &&
      TYPO_KEYS.has(node.name.getText(source))
    ) {
      report(node, 'typography', node.name.getText(source));
    }

    if (
      inScreens(file) &&
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === 'react-native'
    ) {
      const named = node.importClause?.namedBindings;
      if (named && ts.isNamedImports(named)) {
        for (const element of named.elements) {
          const imported = (element.propertyName ?? element.name).text;
          if (imported === 'Text') report(element, 'rn-text', 'Text');
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(source);
  return violations;
}

const files = collectFiles(targets);
const violations = files.flatMap(checkFile);

if (reportOnly) {
  const perFile = new Map<string, Record<Rule, number>>();
  for (const v of violations) {
    const counts = perFile.get(v.file) ?? {
      color: 0,
      typography: 0,
      'rn-text': 0,
      copy: 0,
    };
    counts[v.rule] += 1;
    perFile.set(v.file, counts);
  }
  for (const [file, counts] of perFile) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const parts = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([rule, n]) => `${rule} ${n}`)
      .join(', ');
    console.log(`${String(total).padStart(4)}  ${file}  (${parts})`);
  }
} else {
  for (const v of violations) {
    console.log(`${v.file}:${v.line}  ${v.rule}  ${v.detail.trim()}`);
  }
}

const fileCount = new Set(violations.map((v) => v.file)).size;
console.log(
  `\ncheck:ui — ${files.length} file diperiksa, ${violations.length} pelanggaran di ${fileCount} file.`,
);

if (!reportOnly && violations.length > 0) process.exit(1);
