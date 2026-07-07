from pathlib import Path
import sys

root = Path(__file__).resolve().parents[2]
errors = []

if not (root / 'GEMINI.md').is_file():
    errors.append('missing GEMINI.md')

skills_root = root / '.gemini' / 'skills'
expected = {
    'coding-core',
    'design-analysis',
    'eval-ops',
    'grounded-research',
    'harness-creator-adapter',
    'orchestration-control',
}
if not skills_root.is_dir():
    errors.append('missing .gemini/skills')
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

for rel in [
    '.gemini/ENGINEERING_CONVENTION.md',
    '.gemini/GEMINI_RUNTIME_GUIDE.md',
    '.gemini/README.md',
    '.gemini/validation/gemini_doc_grounding_sources.json',
    '.gemini/validation/gemini_runtime_tests.json',
    '.gemini/validation/skill_routing_scenarios.json',
]:
    if not (root / rel).is_file():
        errors.append(f'missing {rel}')

gemini_text = (root / 'GEMINI.md').read_text(encoding='utf-8') if (root / 'GEMINI.md').is_file() else ''
coding_core = skills_root / 'coding-core' / 'SKILL.md'
coding_text = coding_core.read_text(encoding='utf-8') if coding_core.is_file() else ''
if '.gemini/ENGINEERING_CONVENTION.md' not in gemini_text:
    errors.append('GEMINI.md does not reference .gemini/ENGINEERING_CONVENTION.md')
if '.gemini/ENGINEERING_CONVENTION.md' not in coding_text:
    errors.append('coding-core does not reference .gemini/ENGINEERING_CONVENTION.md')

if errors:
    print('FAIL')
    for error in errors:
        print(f'- {error}')
    sys.exit(1)

print('PASS')
print('gemini_project_ready static layout validation passed')
