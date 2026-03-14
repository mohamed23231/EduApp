import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from '@jest/globals';

const ROOT = path.resolve(__dirname, '../../../../../..');
const TARGET_DIRS = [
  path.join(ROOT, 'src', 'app', '(manager)'),
  path.join(ROOT, 'src', 'modules', 'organization', 'manager', 'components'),
  path.join(ROOT, 'src', 'modules', 'organization', 'manager', 'screens'),
];

function collectTsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__') {
        return [];
      }

      return collectTsxFiles(fullPath);
    }

    return entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

function isVisualSource(content: string): boolean {
  return content.includes('className=') || content.includes('useTranslation(') || content.includes('<SafeAreaView') || content.includes('<View');
}

function usesLayoutPrimitives(content: string): boolean {
  return ['<SafeAreaView', '<ScrollView', '<View', '<Text', '<Pressable'].some(token =>
    content.includes(token),
  );
}

describe('Manager mobile RTL/layout audit', () => {
  const files = TARGET_DIRS.flatMap(collectTsxFiles);

  it('avoids disallowed left/right style props and StyleSheet.create in manager files', () => {
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('marginLeft');
      expect(content).not.toContain('marginRight');
      expect(content).not.toContain('StyleSheet.create');
    }
  });

  it('keeps manager screens and components translation-aware', () => {
    const translatableFiles = files.filter(file =>
      file.includes(`${path.sep}modules${path.sep}organization${path.sep}manager${path.sep}screens${path.sep}`),
    );

    for (const file of translatableFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (!isVisualSource(content)) {
        continue;
      }
      expect(content.includes('useTranslation(') || content.includes('t(')).toBe(true);
    }
  });

  it('uses NativeWind className styling across manager visual surfaces', () => {
    const visualFiles = files.filter(file => !file.endsWith(`${path.sep}_layout.tsx`));

    for (const file of visualFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (!usesLayoutPrimitives(content)) {
        continue;
      }
      expect(content).toContain('className');
    }
  });
});
