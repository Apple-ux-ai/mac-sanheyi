#!/usr/bin/env python3
"""Extract hardcoded Chinese UI strings into a JSON mapping."""

from __future__ import annotations

import argparse
import json
import hashlib
import re
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterator, List, Tuple


DEFAULT_ROOTS: Tuple[str, ...] = (
    "frontend/src",
    "frontend/public",
    "electron",
)

INCLUDE_SUFFIXES: Tuple[str, ...] = (
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".json",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".less",
    ".md",
    ".txt",
)

EXCLUDE_DIR_NAMES: Tuple[str, ...] = (
    ".git",
    "dist",
    "build",
    "node_modules",
    "__pycache__",
    "coverage",
    "out",
    ".next",
    ".turbo",
)

STRING_PATTERN = re.compile(r"(?P<quote>['\"`])(?P<content>(?:\\.|(?!\1).)*?)\1", re.S)
TEXT_PATTERN = re.compile(r">\s*(?P<content>[^<>]*[\u4e00-\u9fff][^<>]*)\s*<")
CJK_PATTERN = re.compile(r"[\u4e00-\u9fff]")
BRACE_PATTERN = re.compile(r"[{}]")
WHITESPACE_PATTERN = re.compile(r"\s+")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect visible Chinese strings into a JSON file.")
    parser.add_argument(
        "--output",
        default="locales/zh_CN.json",
        help="Path for the generated JSON file (default: locales/zh_CN.json)",
    )
    parser.add_argument(
        "--sources-output",
        default="locales/zh_CN.sources.json",
        help="Optional JSON file capturing the source locations for each key (default: locales/zh_CN.sources.json)",
    )
    parser.add_argument(
        "--root",
        dest="roots",
        action="append",
        help="Source directories to scan. Can be supplied multiple times. Defaults to frontend/src, frontend/public, electron.",
    )
    return parser.parse_args()


def iter_source_files(root: Path) -> Iterator[Path]:
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in INCLUDE_SUFFIXES:
            continue
        if any(exclude in path.parts for exclude in EXCLUDE_DIR_NAMES):
            continue
        yield path


def ensure_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            return path.read_text(encoding="gbk")
        except Exception:
            return None


def count_line(text: str, idx: int) -> int:
    return text.count("\n", 0, idx) + 1


def collect_from_text(
    *,
    text: str,
    rel_path: str,
    line_counters: Dict[Tuple[str, int], int],
    entries: Dict[str, str],
) -> None:
    for match in STRING_PATTERN.finditer(text):
        value = match.group("content")
        if not value or not CJK_PATTERN.search(value):
            continue
        line_no = count_line(text, match.start())
        line_counters[(rel_path, line_no)] += 1
        key = f"{rel_path}#L{line_no:04d}#{line_counters[(rel_path, line_no)]:02d}"
        entries[key] = value

    for match in TEXT_PATTERN.finditer(text):
        raw_value = match.group("content")
        if not raw_value or not CJK_PATTERN.search(raw_value):
            continue
        if BRACE_PATTERN.search(raw_value):
            # Likely a JSX expression already captured as a string literal.
            continue
        cleaned = WHITESPACE_PATTERN.sub(" ", raw_value).strip()
        if not cleaned:
            continue
        line_no = count_line(text, match.start("content"))
        line_counters[(rel_path, line_no)] += 1
        key = f"{rel_path}#L{line_no:04d}#{line_counters[(rel_path, line_no)]:02d}"
        entries[key] = cleaned


def normalize_value(value: str) -> str:
    return WHITESPACE_PATTERN.sub(" ", value.strip())


def slugify_for_key(text: str) -> str:
    ascii_text = re.sub(r"[^a-z0-9]+", "-", text.lower())
    ascii_text = ascii_text.strip("-")
    if not ascii_text:
        ascii_text = "msg"
    return ascii_text[:32]


def make_stable_key(value: str) -> str:
    normalized = normalize_value(value)
    digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:8]
    slug = slugify_for_key(normalized)
    return f"{slug}_{digest}"


CODE_HINT_PATTERN = re.compile(r"\b(const|let|function|return|class|extends|import|export|if|else|switch|case|while|for)\b")


def looks_like_ui_text(value: str) -> bool:
    stripped = value.strip()
    if not stripped:
        return False
    if not CJK_PATTERN.search(stripped):
        return False
    if stripped.startswith("//") or stripped.startswith("/*"):
        return False
    if stripped.count("\n") >= 2:
        return False
    if len(stripped) > 220:
        return False
    if "<" in stripped or ">" in stripped:
        return False
    if CODE_HINT_PATTERN.search(stripped):
        return False
    return True


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    roots = [Path(r) for r in (args.roots if args.roots else DEFAULT_ROOTS)]

    entries: Dict[str, str] = {}
    line_counters: Dict[Tuple[str, int], int] = defaultdict(int)
    file_count = 0

    for rel in roots:
        target = (repo_root / rel).resolve()
        if not target.exists():
            continue
        for file_path in iter_source_files(target):
            text = ensure_text(file_path)
            if text is None:
                continue
            rel_path = str(file_path.relative_to(repo_root)).replace("\\", "/")
            collect_from_text(
                text=text,
                rel_path=rel_path,
                line_counters=line_counters,
                entries=entries,
            )
            file_count += 1

    value_by_key: Dict[str, str] = {}
    sources_by_key: Dict[str, List[str]] = defaultdict(list)

    for loc, raw_value in entries.items():
        if not looks_like_ui_text(raw_value):
            continue
        normalized = normalize_value(raw_value)
        key = make_stable_key(normalized)
        if key not in value_by_key:
            value_by_key[key] = raw_value.strip()
        sources_by_key[key].append(loc)

    ordered_keys = sorted(value_by_key.keys(), key=lambda k: normalize_value(value_by_key[k]))
    ordered_entries = {key: value_by_key[key] for key in ordered_keys}

    output_path = (repo_root / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(ordered_entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sources_path: Path | None = None
    if args.sources_output:
        _sources_path = (repo_root / args.sources_output).resolve()
        _sources_path.parent.mkdir(parents=True, exist_ok=True)
        ordered_sources = {key: sorted(sources_by_key[key]) for key in ordered_keys}
        _sources_path.write_text(json.dumps(ordered_sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        sources_path = _sources_path

    print(f"Scanned files: {file_count}")
    print(f"Unique UI strings: {len(ordered_entries)}")
    print(f"Output written to: {output_path}")
    if sources_path is not None:
        print(f"Source map written to: {sources_path}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
