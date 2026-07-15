#!/usr/bin/env python3
"""
Normalize all product descriptions for FormattedDescription renderer.

Supported markup (ONLY):
  - real newlines (or literal \\n converted to real newlines)
  - **bold**
  - bullet lines starting with: * - • ✅ ⭐ ✓ etc.

Does NOT support: /n /b \\b or other escape codes.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request

import os

PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "vuffzfuklzzcnfnubtzx")
API = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")


def sql_query(query: str):
    data = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "snippy-mart-desc-fix/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        if not body or body == "[]":
            return []
        return json.loads(body)


def fix_mojibake(text: str) -> str:
    """Fix classic UTF-8 interpreted as Latin-1 double-encoding."""
    if not text:
        return text
    try:
        fixed = text.encode("latin-1", errors="strict").decode("utf-8", errors="strict")
        # Prefer fixed if it introduces more useful unicode
        return fixed
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def normalize_newlines(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Literal backslash-n sequences people paste by mistake
    text = text.replace("\\n", "\n")
    text = text.replace("\\r\\n", "\n")
    text = text.replace("\\r", "\n")
    # Collapse 3+ blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n" if text.strip() else ""


# Leading markers that should become checklist bullets
BULLET_LEAD_RE = re.compile(
    r"^(?:"
    r"[\*\-•✅⭐✓✔▪▸●◦·☑]"
    r"|✅"
    r"|\?"  # broken checkmarks that became ?
    r"|\u00e2\u009c\u0085"  # mojibake leftover if any
    r")\s*"
)

# Headers we want bold via ** **
HEADER_NAMES = {
    "what you get",
    "what's included",
    "whats included",
    "how it works",
    "included",
    "features",
    "premium benefits",
    "pricing",
    "plan details",
    "perfect for",
    "important",
    "note",
    "sm details",
    "compatible with",
    "api documentation",
    "includes",
    "choose warranty",
    "choose warranty at checkout",
    "how pricing works",
}


def bold_key_phrases(line: str) -> str:
    """Add **bold** around common labels without double-bolding."""
    if "**" in line:
        return line

    # Important: / Note: labels
    m = re.match(r"^(Important|Note|Warning|SM Details)\s*:\s*(.*)$", line, re.I)
    if m:
        rest = m.group(2).strip()
        label = m.group(1).strip()
        return f"**{label}:** {rest}" if rest else f"**{label}:**"

    # Only LKR price lines
    m = re.match(r"^(Only LKR[\d,\s\.]+(?:\s*[·•\-|–—].*)?)$", line, re.I)
    if m:
        return f"**{line.strip()}**"

    # Special Price lines
    m = re.match(r"^(Special (?:Price|Offer).+)$", line, re.I)
    if m:
        return f"**{line.strip()}**"

    # Product: / Official: / Our price:
    m = re.match(r"^(Product|Official|Our price|Retail reference)\s*:\s*(.+)$", line, re.I)
    if m:
        return f"**{m.group(1)}:** {m.group(2).strip()}"

    return line


def format_header_line(line: str) -> str:
    cleaned = line.strip().rstrip(":")
    if cleaned.lower() in HEADER_NAMES or cleaned.lower().rstrip(":") in HEADER_NAMES:
        if "**" not in cleaned:
            return f"**{cleaned}**"
        return cleaned
    # ALL CAPS short headers
    if (
        cleaned.upper() == cleaned
        and re.search(r"[A-Z]", cleaned)
        and 3 < len(cleaned) < 80
        and "**" not in cleaned
    ):
        return f"**{cleaned}**"
    return line


def normalize_line(line: str) -> str:
    raw = line.rstrip()
    if not raw.strip():
        return ""

    stripped = raw.strip()

    # Convert bullet-like starts to ✅
    if BULLET_LEAD_RE.match(stripped):
        body = BULLET_LEAD_RE.sub("", stripped).strip()
        body = bold_key_phrases(body)
        # Bold leading label before em-dash or hyphen separators in bullets
        if "**" not in body:
            body = re.sub(
                r"^([A-Za-z0-9][A-Za-z0-9 &+/']{1,40}?)\s*[–—\-]\s+",
                r"**\1** — ",
                body,
                count=1,
            )
        return f"✅ {body}"

    # Numbered steps stay as paragraphs but bold the number label lightly
    if re.match(r"^\d+\.\s+", stripped) and "**" not in stripped:
        stripped = re.sub(r"^(\d+)\.\s+", r"**\1.** ", stripped)

    # Section headers
    header_candidate = stripped.rstrip(":")
    if header_candidate.lower() in HEADER_NAMES or (
        stripped.endswith(":") and len(stripped) <= 48 and "." not in stripped
    ):
        return format_header_line(stripped)

    if stripped.upper() == stripped and re.search(r"[A-Z]", stripped) and 3 < len(stripped) < 80:
        return format_header_line(stripped)

    return bold_key_phrases(stripped)


def normalize_description(desc: str) -> str:
    if not desc:
        return desc

    text = fix_mojibake(desc)
    text = normalize_newlines(text)

    # Clean common junk replacements after mojibake
    replacements = {
        "\u00a0": " ",  # nbsp
        "â€”": "—",
        "â€“": "–",
        "â€™": "'",
        "â€˜": "'",
        'â€œ': '"',
        'â€': '"',
        "â€¢": "•",
        "Ã—": "×",
        "Â·": "·",
        "Â": "",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)

    lines = text.split("\n")
    out: list[str] = []
    for line in lines:
        out.append(normalize_line(line))

    # Trim trailing empties, keep single blank between sections
    cleaned: list[str] = []
    for line in out:
        if line == "" and (not cleaned or cleaned[-1] == ""):
            continue
        cleaned.append(line)
    while cleaned and cleaned[-1] == "":
        cleaned.pop()

    return "\n".join(cleaned)


def main():
    dry = "--dry-run" in sys.argv
    if not TOKEN:
        print("Set SUPABASE_ACCESS_TOKEN env var (Supabase personal access token).", file=sys.stderr)
        sys.exit(1)
    rows = sql_query("select id, name, description from products order by name")
    print(f"Loaded {len(rows)} products")

    updates = []
    for row in rows:
        old = row.get("description") or ""
        new = normalize_description(old)
        if new != old:
            updates.append((row["id"], row["name"], old, new))

    print(f"Will update {len(updates)} products")
    for _id, name, old, new in updates:
        print(f"\n--- {name} ---")
        print("OLD:")
        print(old[:500])
        print("NEW:")
        print(new[:500])

    if dry:
        print("\nDry run — no DB writes")
        return

    for _id, name, old, new in updates:
        # Dollar-quote to safely embed newlines / quotes
        tag = "d"
        while f"${tag}$" in new:
            tag += "x"
        q = (
            f"UPDATE public.products SET description = ${tag}${new}${tag}$, "
            f"updated_at = now() WHERE id = '{_id}' RETURNING name;"
        )
        res = sql_query(q)
        print(f"Updated: {name} -> {res}")

    print("Done.")


if __name__ == "__main__":
    main()
