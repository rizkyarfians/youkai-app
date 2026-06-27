import json
import sys
from pathlib import Path

import openpyxl


JOB_MAP = {
    "biochemist": {"id": 7, "name": "Biochemist", "slug": "biochemist"},
    "champion": {"id": 14, "name": "Monk", "slug": "monk"},
    "gypsy": {"id": 5, "name": "Gypsy", "slug": "gypsy"},
    "high wizard": {"id": 9, "name": "High Wizard", "slug": "high-wizard"},
    "hp": {"id": 11, "name": "High Priest", "slug": "high-priest"},
    "lord knight": {"id": 1, "name": "Lord Knight", "slug": "lord-knight"},
    "mastersmith": {"id": 10, "name": "Whitesmith", "slug": "whitesmith"},
    "minstrel": {"id": 4, "name": "Minstrel", "slug": "minstrel"},
    "paladin": {"id": 6, "name": "Paladin", "slug": "paladin"},
    "professor": {"id": 8, "name": "Professor", "slug": "professor"},
    "sinx": {"id": 2, "name": "Assassin", "slug": "assassin"},
    "sniper": {"id": 13, "name": "Sniper", "slug": "sniper"},
    "summoner": {"id": 12, "name": "Doram", "slug": "doram"},
}

STATUS_MAP = {
    "bye bye": "bye-bye",
    "inactive": "inactive",
    "observation": "observation",
    "poor attenance": "poor-attendance",
    "poor attendance": "poor-attendance",
}

POSITION_MAP = {
    "leader": "Guild Master",
    "guild master": "Guild Master",
    "vice": "Vice Guild Master",
    "vice guild master": "Vice Guild Master",
    "commander": "Commander",
    "charisma baby": "Charisma Baby",
    "officer": "Officer",
    "kumo": "Kumo",
    "noroi": "Noroi",
    "member": "Member",
    "new": "NEW",
}


def clean_text(value):
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def number_or_zero(value):
    if value is None:
        return 0

    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def normalize_job(source_job):
    key = (source_job or "").strip().lower()
    job = JOB_MAP.get(key)

    if job:
        return job

    slug = key.replace(" ", "-") or "default"
    return {"id": None, "name": source_job or "-", "slug": slug}


def normalize_status(remark):
    key = (remark or "").strip().lower()
    return STATUS_MAP.get(key, "active")


def normalize_position(position):
    key = (position or "").strip().lower()
    return POSITION_MAP.get(key, "Member")


def attendance_from_row(headers, values):
    attendance = {}

    for header, value in zip(headers[8:31], values[8:31]):
        if not header:
            continue

        attendance[str(header)] = number_or_zero(value)

    return attendance


def extract_members(workbook_path):
    workbook = openpyxl.load_workbook(workbook_path, data_only=True)
    sheet = workbook["Members"]
    headers = [cell.value for cell in sheet[1]]
    members = []

    for row_number, values in enumerate(
        sheet.iter_rows(min_row=2, values_only=True),
        start=2,
    ):
        excel_id = values[0]
        nickname = clean_text(values[1])
        source_job = clean_text(values[2])

        if not nickname or not source_job:
            continue

        job = normalize_job(source_job)
        position = normalize_position(clean_text(values[3]))
        remark = clean_text(values[4])
        attendance_total = number_or_zero(values[5])
        attendance_may = number_or_zero(values[6])
        attendance_june = number_or_zero(values[7])

        member_id = number_or_zero(excel_id) or len(members) + 1
        members.append(
            {
                "id": member_id,
                "nickname": nickname,
                "position": position,
                "status": normalize_status(remark),
                "remark": remark,
                "source_job": source_job,
                "job_id": job["id"],
                "job_name": job["name"],
                "job_slug": job["slug"],
                "job_icon": job["slug"],
                "activity_score": attendance_total,
                "attendance_total": attendance_total,
                "attendance_may": attendance_may,
                "attendance_june": attendance_june,
                "attendance": attendance_from_row(headers, values),
                "source": {
                    "workbook": Path(workbook_path).name,
                    "sheet": "Members",
                    "row": row_number,
                },
            }
        )

    return members


def main():
    project_root = Path(__file__).resolve().parents[1]
    default_input = Path.home() / "Downloads" / "YOUKAI.xlsx"
    default_output = project_root / "data" / "youkai-members.json"

    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else default_input
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else default_output

    members = extract_members(workbook_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {
                "source": str(workbook_path),
                "member_count": len(members),
                "members": members,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Extracted {len(members)} members to {output_path}")


if __name__ == "__main__":
    main()
