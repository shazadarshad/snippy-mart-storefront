#!/usr/bin/env python3
"""
Train AI knowledge base from all active products.

Writes ai_knowledge_items rows with keys prefixed auto_train: so re-runs
replace previous auto training without deleting manually curated notes.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.request

PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "vuffzfuklzzcnfnubtzx")
API = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")


def sql(query: str):
    data = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "snippy-mart-ai-train/1.0",
            "Accept": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode("utf-8")
        if not body:
            return []
        return json.loads(body)


def dollar(s: str, tag: str = "d") -> str:
    while f"${tag}$" in s:
        tag += "x"
    return f"${tag}${s}${tag}$"


def fmt_lkr(v) -> str:
    try:
        n = float(v)
        return f"LKR {n:,.0f}" if n == int(n) else f"LKR {n:,.2f}"
    except Exception:
        return f"LKR {v}"


def req_text(req) -> str:
    if not req or not isinstance(req, dict):
        return "No special login credentials required at checkout."
    parts = []
    if req.get("require_email"):
        parts.append("email")
    if req.get("require_password"):
        parts.append("password")
    if req.get("require_username"):
        parts.append("username")
    if not parts:
        return "No customer account email/password required at checkout."
    return (
        "Customer must provide "
        + " + ".join(parts)
        + " at checkout for fulfillment (own-account upgrade / delivery as described)."
    )


def clean_desc(desc: str, limit: int = 900) -> str:
    if not desc:
        return ""
    text = desc.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) > limit:
        text = text[: limit - 1] + "…"
    return text


def main():
    if not TOKEN:
        print("Set SUPABASE_ACCESS_TOKEN", file=sys.stderr)
        sys.exit(1)

    dry = "--dry-run" in sys.argv

    products = sql(
        """
        SELECT id, name, slug, description, category, price, old_price,
               stock_status, requirements, manual_fulfillment, is_featured, is_active
        FROM products
        WHERE is_active = true
        ORDER BY display_order NULLS LAST, name
        """
    )
    plans = sql(
        """
        SELECT id, product_id, name, duration, price, old_price, is_default
        FROM product_pricing_plans
        ORDER BY product_id, price
        """
    )
    variants = sql(
        """
        SELECT id, plan_id, name, price, old_price, is_active, stock_status
        FROM product_pricing_plan_variants
        WHERE COALESCE(is_active, true) = true
        ORDER BY plan_id, price
        """
    )

    plans_by_product: dict[str, list] = {}
    for p in plans:
        plans_by_product.setdefault(p["product_id"], []).append(p)

    variants_by_plan: dict[str, list] = {}
    for v in variants:
        variants_by_plan.setdefault(v["plan_id"], []).append(v)

    print(f"Active products: {len(products)}")
    print(f"Plans: {len(plans)} | Variants: {len(variants)}")

    # Remove previous auto training only
    if not dry:
        deleted = sql(
            "DELETE FROM ai_knowledge_items WHERE key LIKE 'auto_train:%' RETURNING id;"
        )
        print(f"Removed previous auto_train rows: {len(deleted)}")

    rows_to_insert = []

    # Catalog summary
    names = [p["name"] for p in products]
    catalog_value = (
        f"Snippy Mart sells {len(products)} active digital products/subscriptions. "
        f"Browse all at https://snippymart.com/products. "
        f"Catalog includes: " + "; ".join(names[:40])
        + ("…" if len(names) > 40 else "")
        + ". Always quote prices in LKR."
    )
    rows_to_insert.append(
        {
            "category": "general",
            "product_id": None,
            "key": "auto_train:catalog_summary",
            "value": catalog_value,
            "priority": 100,
            "question": None,
            "answer": None,
        }
    )

    for prod in products:
        pid = prod["id"]
        name = prod["name"]
        slug = prod["slug"] or ""
        url = f"https://snippymart.com/product/{slug}" if slug else "https://snippymart.com/products"

        # Overview
        overview = (
            f"{name}. Category: {prod.get('category') or 'Digital'}. "
            f"Stock: {prod.get('stock_status') or 'unknown'}. "
            f"Base price: {fmt_lkr(prod.get('price'))}. "
            f"Page: {url}."
        )
        if prod.get("old_price"):
            overview += f" Old price reference: {fmt_lkr(prod['old_price'])}."
        if prod.get("is_featured"):
            overview += " Featured product."

        rows_to_insert.append(
            {
                "category": "product_detail",
                "product_id": pid,
                "key": f"auto_train:{slug}:overview",
                "value": overview,
                "priority": 50,
                "question": None,
                "answer": None,
            }
        )

        # Requirements
        rows_to_insert.append(
            {
                "category": "product_detail",
                "product_id": pid,
                "key": f"auto_train:{slug}:requirements",
                "value": f"{name}: {req_text(prod.get('requirements'))}",
                "priority": 55,
                "question": f"What do I need to provide for {name}?",
                "answer": req_text(prod.get("requirements")),
            }
        )

        # Pricing / plans
        pplans = plans_by_product.get(pid, [])
        if pplans:
            lines = [f"Pricing for {name}:"]
            for pl in pplans:
                vs = variants_by_plan.get(pl["id"], [])
                if vs:
                    for v in vs:
                        lines.append(
                            f"- {pl.get('name') or pl.get('duration') or 'Plan'} / {v['name']}: {fmt_lkr(v['price'])}"
                        )
                else:
                    label = pl.get("name") or pl.get("duration") or "Plan"
                    lines.append(f"- {label}: {fmt_lkr(pl['price'])}")
            price_text = "\n".join(lines)
        else:
            price_text = f"{name} price: {fmt_lkr(prod.get('price'))} (single listing; check product page for updates)."

        rows_to_insert.append(
            {
                "category": "product_detail",
                "product_id": pid,
                "key": f"auto_train:{slug}:pricing",
                "value": price_text,
                "priority": 60,
                "question": f"How much is {name}?",
                "answer": price_text.replace("\n", " "),
            }
        )

        # Delivery / fulfillment
        fulfillment = (
            "Manual team fulfillment after payment confirmation."
            if prod.get("manual_fulfillment")
            else "Standard digital fulfillment after payment."
        )
        delivery = (
            f"{name}: {fulfillment} "
            f"Delivery is digital. Typical window is within 24 hours during support hours unless the product description says longer (e.g. 7–10 days). "
            f"Order page: {url}"
        )
        rows_to_insert.append(
            {
                "category": "product_detail",
                "product_id": pid,
                "key": f"auto_train:{slug}:delivery",
                "value": delivery,
                "priority": 40,
                "question": f"How is {name} delivered?",
                "answer": delivery,
            }
        )

        # Description training
        desc = clean_desc(prod.get("description") or "")
        if desc:
            rows_to_insert.append(
                {
                    "category": "product_detail",
                    "product_id": pid,
                    "key": f"auto_train:{slug}:description",
                    "value": f"{name} description:\n{desc}",
                    "priority": 45,
                    "question": f"Tell me about {name}",
                    "answer": desc[:500],
                }
            )

        # FAQ category entry for product Q&A
        rows_to_insert.append(
            {
                "category": "faq",
                "product_id": pid,
                "key": f"auto_train:{slug}:faq_buy",
                "value": f"To buy {name}, open {url}, add to cart, checkout in LKR, complete payment.",
                "priority": 30,
                "question": f"How do I buy {name}?",
                "answer": f"Open {url}, choose a plan if shown, checkout, pay in LKR. WhatsApp +94-78-776-7869 if you need help.",
            }
        )

    print(f"Prepared {len(rows_to_insert)} knowledge rows")

    if dry:
        print("Dry run sample:")
        for r in rows_to_insert[:6]:
            print(json.dumps(r, ensure_ascii=False)[:300])
        return

    # Insert in chunks via SQL
    chunk = 25
    inserted = 0
    for i in range(0, len(rows_to_insert), chunk):
        batch = rows_to_insert[i : i + chunk]
        values_sql = []
        for r in batch:
            pid = "NULL" if not r["product_id"] else f"'{r['product_id']}'"
            q = "NULL" if r["question"] is None else dollar(r["question"], "q")
            a = "NULL" if r["answer"] is None else dollar(r["answer"], "a")
            values_sql.append(
                "("
                f"{dollar(r['category'], 'c')}, "
                f"{pid}, "
                f"{dollar(r['key'], 'k')}, "
                f"{dollar(r['value'], 'v')}, "
                f"{r['priority']}, "
                f"true, "
                f"{q}, "
                f"{a}"
                ")"
            )
        query = f"""
        INSERT INTO ai_knowledge_items
          (category, product_id, key, value, priority, is_active, question, answer)
        VALUES
          {", ".join(values_sql)}
        RETURNING id;
        """
        res = sql(query)
        inserted += len(res)
        print(f"Inserted batch {i // chunk + 1}: {len(res)} rows")

    total = sql("SELECT count(*)::int AS c FROM ai_knowledge_items WHERE is_active = true;")
    auto = sql(
        "SELECT count(*)::int AS c FROM ai_knowledge_items WHERE key LIKE 'auto_train:%' AND is_active = true;"
    )
    print(f"Done. Inserted ~{inserted}. Active total={total[0]['c'] if total else '?'} auto_train={auto[0]['c'] if auto else '?'}")


if __name__ == "__main__":
    main()
