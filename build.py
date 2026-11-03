#!/usr/bin/env python3
"""Сборка статического сайта promstatus.ru в папку dist/."""
import hashlib
import json
import re
import shutil
import tomllib
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import markdown
from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).parent
TODAY = (datetime.now(timezone.utc) + timedelta(hours=3)).date()  # дата по Москве: статьи с будущей датой не публикуются
DIST = ROOT / "dist"
SITE = tomllib.loads((ROOT / "site.toml").read_text(encoding="utf-8"))
HOME = tomllib.loads((ROOT / "content" / "home.toml").read_text(encoding="utf-8"))

env = Environment(loader=FileSystemLoader(ROOT / "templates"), autoescape=select_autoescape(["html"]))

MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля",
          "августа", "сентября", "октября", "ноября", "декабря"]


def ru_date(s):
    d = date.fromisoformat(str(s))
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def file_hash(p):
    return hashlib.md5(p.read_bytes()).hexdigest()[:8]


def read_md(p):
    text = p.read_text(encoding="utf-8")
    meta, body = {}, text
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        body = m.group(2)
    # подстановка {{ owner_name }} и т.п. из site.toml (для политики)
    body = env.from_string(body).render(**SITE)
    html = markdown.markdown(body, extensions=["tables", "sane_lists"])
    return meta, html


def write(path, html):
    out = DIST / path.lstrip("/")
    if path.endswith("/"):
        out = out / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    shutil.copytree(ROOT / "static", DIST / "static")
    # файлы для корня сайта (подтверждения поисковиков и т.п.)
    if (ROOT / "root").exists():
        for f in (ROOT / "root").iterdir():
            if f.is_file():
                shutil.copy2(f, DIST / f.name)
    v = {"css": file_hash(DIST / "static/css/style.css"), "calc": file_hash(DIST / "static/js/calc.js")}
    # Статьи: список для раздела, подвала и блока «Читайте также» (новые сверху)
    articles = []
    for p in (ROOT / "content" / "articles").glob("*.md"):
        meta, _ = read_md(p)
        if meta.get("date") and date.fromisoformat(meta["date"]) > TODAY:
            continue
        articles.append({"path": "/" + meta["slug"].strip("/") + "/", "h1": meta.get("h1", meta["title"]),
                         "short": meta.get("short", meta.get("h1", meta["title"])),
                         "description": meta.get("description", ""), "date": meta.get("date", ""),
                         "date_ru": ru_date(meta["date"]) if meta.get("date") else ""})
    articles.sort(key=lambda a: a["date"], reverse=True)
    base = {"site": SITE, "v": v, "scripts": [], "jsonld": None, "latest_articles": articles}
    urls = []
    lastmod = {}

    org = {
        "@context": "https://schema.org", "@type": "ProfessionalService",
        "name": SITE["name"], "url": SITE["base_url"], "email": SITE["email"], "telephone": SITE["phone"],
        "logo": SITE["base_url"] + "/static/img/apple-touch-icon.png", "image": SITE["base_url"] + "/static/img/og-promstatus.png",
        "description": "Включение продукции лёгкой промышленности в реестр российской промышленной продукции по ПП №719.",
        "areaServed": "RU",
    }
    faq = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": f["q"],
                        "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in HOME["faq"]],
    }

    # Главная
    write("/", env.get_template("index.html").render(
        **{**base, "jsonld": json.dumps([org, faq], ensure_ascii=False).replace("</", "<\\/")}, h=HOME, path="/",
        page_title="Включение в реестр Минпромторга для лёгкой промышленности – ПромСтатус",
        description="Подтверждаем российское производство одежды, спецодежды, трикотажа, текстиля, обуви и аксессуаров по ПП №719. Бесплатный экспресс-аудит до 3 рабочих дней. От 140 000 ₽."))
    urls.append("/")

    # Калькулятор
    write("/kalkulyator/", env.get_template("calc.html").render(
        **{**base, "scripts": [f"/static/js/calc.js?v={v['calc']}"]}, path="/kalkulyator/",
        page_title="Калькулятор баллов по разделу XVII ПП №719 – ПромСтатус",
        description="Посчитайте баллы для акта экспертизы ТПП: одежда для спортсменов, спецодежда и форма, бельё, носки, сумки. Пороги по ПП №719 в ред. от 15.10.2026."))
    urls.append("/kalkulyator/")

    # Раздел «Статьи»
    ld = [{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": SITE["base_url"] + "/"},
        {"@type": "ListItem", "position": 2, "name": "Статьи", "item": SITE["base_url"] + "/stati/"}]}]
    write("/stati/", env.get_template("stati.html").render(
        **{**base, "jsonld": json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")}, path="/stati/", articles=articles,
        page_title="Статьи о реестре Минпромторга для лёгкой промышленности – ПромСтатус",
        description="Изменения ПП №719 и ПП №1875 для производителей одежды, обуви и текстиля: ПП №1026, СТ-1 после 01.01.2027, акт экспертизы ТПП."))
    urls.append("/stati/")
    if articles:
        lastmod["/stati/"] = max(a["date"] for a in articles)

    # Страницы и статьи
    crumbs_map = {"uslugi": [{"name": "Услуги", "href": "/#prices"}]}
    for folder, is_article in (("pages", False), ("articles", True)):
        for p in sorted((ROOT / "content" / folder).glob("*.md")):
            meta, html = read_md(p)
            if is_article and meta.get("date") and date.fromisoformat(meta["date"]) > TODAY:
                print("отложена до", meta["date"], ":", meta["slug"])
                continue
            path = "/" + meta["slug"].strip("/") + "/"
            first = meta["slug"].split("/")[0]
            crumbs = [{"name": "Статьи", "href": "/stati/"}] if is_article else list(crumbs_map.get(first, []))
            crumbs.append({"name": meta.get("h1", meta["title"]), "href": path})
            ld = [{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "name": c["name"], "item": SITE["base_url"] + c["href"]}
                for i, c in enumerate([{"name": "Главная", "href": "/"}] + crumbs)]}]
            svc = {"uslugi/st-1": ("Включение в реестр Минпромторга по СТ-1 под ключ", 140000),
                   "uslugi/akt-tpp": ("Акт экспертизы ТПП и запись в реестре под ключ", 180000),
                   "uslugi/etap": ("Проверка пакета для ТПП или ответ на замечания", 40000),
                   "uslugi/soprovozhdenie": ("Сопровождение записей в реестре Минпромторга", 80000)}.get(meta["slug"].strip("/"))
            if svc:
                ld.append({"@context": "https://schema.org", "@type": "Service", "name": svc[0], "serviceType": "Включение продукции в реестр российской промышленной продукции",
                           "provider": {"@type": "ProfessionalService", "name": SITE["name"], "url": SITE["base_url"]}, "areaServed": "RU",
                           "url": SITE["base_url"] + path, "description": meta.get("description", ""),
                           "offers": {"@type": "Offer", "priceCurrency": "RUB", "price": svc[1],
                                      "priceSpecification": {"@type": "PriceSpecification", "minPrice": svc[1], "priceCurrency": "RUB"}}})
            if is_article:
                ld.append({"@context": "https://schema.org", "@type": "Article", "headline": meta.get("h1", meta["title"]),
                           "description": meta.get("description", ""), "datePublished": meta.get("date"),
                           "dateModified": meta.get("updated", meta.get("date")), "inLanguage": "ru",
                           "mainEntityOfPage": SITE["base_url"] + path, "image": SITE["base_url"] + "/static/img/og-promstatus.png",
                           "author": {"@type": "Person", "name": "Анатолий Алимов", "jobTitle": "руководитель проекта", "url": SITE["base_url"] + "/o-nas/"},
                           "publisher": {"@type": "Organization", "name": SITE["name"], "url": SITE["base_url"]}})
            if meta.get("updated") or meta.get("date"):
                lastmod[path] = meta.get("updated", meta.get("date"))
            write(path, env.get_template("page.html").render(
                **{**base, "jsonld": json.dumps(ld, ensure_ascii=False).replace("</", "<\\/")},
                og_type="article" if is_article else "website", noindex=meta.get("noindex") == "true",
                path=path, page_title=f'{meta["title"]} – {SITE["name"]}',
                description=meta.get("description", ""), h1=meta.get("h1", meta["title"]),
                kicker=meta.get("kicker"), body=html, crumbs=crumbs,
                date=ru_date(meta["date"]) if meta.get("date") else None,
                cta=meta["slug"] not in ("politika", "spasibo"),
                is_article=is_article,
                read_also=[a for a in articles if a["path"] != path][:3] if is_article else None))
            if meta.get("noindex") != "true":
                urls.append(path)

    # 404
    (DIST / "404.html").write_text(env.get_template("404.html").render(
        **base, noindex=True, path="/404.html", page_title=f'Страница не найдена – {SITE["name"]}', description=""), encoding="utf-8")

    # .htaccess: своя страница 404 и кодировка
    (DIST / ".htaccess").write_text("ErrorDocument 404 /404.html\nAddDefaultCharset UTF-8\n", encoding="utf-8")

    # robots и sitemap
    (DIST / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /404.html\n\nUser-agent: Yandex\nAllow: /\nDisallow: /404.html\nClean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&from\n\nSitemap: {SITE['base_url']}/sitemap.xml\n", encoding="utf-8")
    today = TODAY.isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f"  <url><loc>{SITE['base_url']}{u}</loc><lastmod>{lastmod.get(u, today)}</lastmod></url>" for u in urls]
    sm.append("</urlset>")
    (DIST / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")

    # Манифест и отпечаток сборки (для скрипта на хостинге)
    files = sorted(str(p.relative_to(DIST)) for p in DIST.rglob("*") if p.is_file())
    h = hashlib.sha256()
    for f in files:
        h.update(f.encode())
        h.update((DIST / f).read_bytes())
    (DIST / "manifest.txt").write_text("\n".join(files + ["manifest.txt", "build-hash.txt"]) + "\n", encoding="utf-8")
    (DIST / "build-hash.txt").write_text(h.hexdigest()[:16] + "\n", encoding="utf-8")
    print(f"OK: {len(urls)} страниц, {len(files)} файлов, hash {h.hexdigest()[:16]}")


if __name__ == "__main__":
    main()
