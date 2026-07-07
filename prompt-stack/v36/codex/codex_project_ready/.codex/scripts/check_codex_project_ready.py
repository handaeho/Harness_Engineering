from pathlib import Path
import sys

root = Path(__file__).resolve().parents[2]
errors = []

if not (root / 'AGENTS.md').is_file():
    errors.append('missing AGENTS.md')

skills_root = root / '.agents' / 'skills'
expected = {
    'coding-core',
    'design-analysis',
    'eval-ops',
    'grounded-research',
    'harness-creator-adapter',
    'orchestration-control',
}
if not skills_root.is_dir():
    errors.append('missing .agents/skills')
else:
    found = {p.name for p in skills_root.iterdir() if p.is_dir()}
    missing = expected - found
    extra = found - expected
    if missing:
        errors.append(f'missing skills: {sorted(missing)}')
    if extra:
        errors.append(f'unexpected skills: {sorted(extra)}')
    for name in expected & found:
        skill = skills_root / name / 'SKILL.md'
        if not skill.is_file():
            errors.append(f'missing {skill}')
            continue
        text = skill.read_text(encoding='utf-8')
        if f'name: {name}' not in text:
            errors.append(f'{skill} missing matching name')
        if 'description:' not in text:
            errors.append(f'{skill} missing description')

if (root / '.codex' / 'skills').exists():
    errors.append('unexpected .codex/skills; repo skills should be under .agents/skills')

for rel in [
    '.codex/CODEX_RUNTIME_GUIDE.md',
    '.codex/validation/codex_doc_grounding_sources.json',
    '.codex/validation/codex_runtime_tests.json',
    '.codex/validation/skill_routing_scenarios.json',
]:
    if not (root / rel).is_file():
        errors.append(f'missing {rel}')

if errors:
    print('FAIL')
    for error in errors:
        print(f'- {error}')
    sys.exit(1)

print('PASS')
print('codex_project_ready static layout validation passed')
