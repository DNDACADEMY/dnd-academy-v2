#!/usr/bin/env python3
"""
DND 기수별 프로젝트 및 리뷰 업데이트 스크립트

사용법:
    python3 update_generation.py <CSV_FILE_PATH>

예시:
    python3 update_generation.py "/Users/ijihyeong/Downloads/[14기] DND 후기.csv"

CSV 컬럼 형식:
    - 프로젝트명
    - 프로젝트 배너 파일 (Google Drive 링크)
    - 프로젝트 소개 파일(PDF) (Google Drive 링크)
    - 프로젝트 명
    - 프로젝트 한 줄 소개 문구
    - 프로젝트 장문형 소개 문구
    - 프로젝트에서 사용한 기술 스택
    - 프로젝트 관련 링크
    - 개인 후기
    - 기수
    - 조
    - 이름
    - 직군
    - 이메일
    - 링크
"""

import csv
import json
import re
import sys
from pathlib import Path

# 프로젝트 루트 경로
PROJECT_ROOT = Path(__file__).parent.parent.parent
PROJECTS_JSON = PROJECT_ROOT / "apps/web/src/lib/assets/data/projects.json"
REVIEWS_JSON = PROJECT_ROOT / "apps/web/src/lib/assets/data/reviews.json"


def parse_csv(csv_path):
    """CSV 파일 파싱 및 프로젝트별 그룹화"""
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    projects_dict = {}
    all_members = []

    for row in rows:
        project_name = row.get('프로젝트 명', '').strip()
        if not project_name:
            continue

        # 기수 정보 (항상 "N기" 형식으로 통일)
        flag = row.get('기수', '').strip()
        if flag:
            # 숫자만 추출
            cohort_num = re.search(r'\d+', flag)
            if cohort_num:
                flag = f"{cohort_num.group()}기"

        team_number = row.get('조', '').strip()

        # 프로젝트 정보 저장
        if project_name not in projects_dict:
            projects_dict[project_name] = {
                'name': project_name,
                'members': [],
                'title': row.get('프로젝트 한 줄 소개 문구', '').strip(),
                'desc': row.get('프로젝트 장문형 소개 문구', '').strip(),
                'skills': row.get('프로젝트에서 사용한 기술 스택', '').strip(),
                'banner': row.get('프로젝트 배너 파일', '') or row.get('DND 프로젝트 배너 파일\n- 팀별로 1개 업로드', ''),
                'pdf': row.get('프로젝트 소개 파일(PDF)', '') or row.get('DND 프로젝트 소개 파일(PDF) \n- 팀별로 1개 업로드', ''),
                'project_links': row.get('프로젝트 관련 링크', '').strip(),
                'flag': flag,
                'team_number': team_number
            }

        # 멤버 정보
        member = {
            'name': row.get('이름', '').strip(),
            'position': row.get('직군', '').strip(),
            'review': row.get('개인 후기', '') or row.get('개인 후기 (홈페이지 업로드 예시)', '') or row.get('DND 활동 후기', ''),
            'email': row.get('이메일', '') or row.get('이메일 주소', ''),
            'links': row.get('링크', ''),
            'project': project_name,
            'flag': flag
        }

        projects_dict[project_name]['members'].append(member)
        all_members.append(member)

    return projects_dict, all_members


def parse_links(link_text):
    """링크 텍스트 파싱"""
    links = {
        "github": "",
        "velog": "",
        "linkedin": "",
        "link": "",
        "medium": "",
        "instagram": ""
    }

    if not link_text:
        return links

    # 줄바꿈이나 쉼표로 분리
    parts = re.split(r'[,\n]', link_text)

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # GitHub
        if re.match(r'깃[허헙]|github', part, re.IGNORECASE):
            match = re.search(r'https?://[^\s]+', part)
            if match:
                links['github'] = match.group(0)
        # LinkedIn
        elif re.match(r'링크드인|linkedin', part, re.IGNORECASE):
            match = re.search(r'https?://[^\s]+|www\.[^\s]+', part)
            if match:
                url = match.group(0)
                if not url.startswith('http'):
                    url = 'https://' + url
                links['linkedin'] = url
        # Velog
        elif re.match(r'블로그|velog|벨로그', part, re.IGNORECASE):
            match = re.search(r'https?://[^\s]+', part)
            if match:
                url = match.group(0)
                if 'velog' in url:
                    links['velog'] = url
                else:
                    links['link'] = url
        # Instagram
        elif re.match(r'인스타그램|instagram', part, re.IGNORECASE):
            match = re.search(r'[@\w]+|https?://[^\s]+', part)
            if match:
                links['instagram'] = match.group(0)
        # Medium
        elif 'medium' in part.lower():
            match = re.search(r'https?://[^\s]+', part)
            if match:
                links['medium'] = match.group(0)
        # Notefolio, Behance
        elif re.match(r'노트폴리오|behance|비핸스', part, re.IGNORECASE):
            match = re.search(r'https?://[^\s]+', part)
            if match:
                links['link'] = match.group(0)
        # 단독 URL
        elif part.startswith('http') or part.startswith('www'):
            url = part
            if not url.startswith('http'):
                url = 'https://' + url

            if 'github' in url and '/dnd-side-project/' not in url:
                if not links['github']:
                    links['github'] = url
            elif 'linkedin' in url:
                links['linkedin'] = url
            elif 'velog' in url:
                links['velog'] = url
            elif 'medium' in url:
                links['medium'] = url
            else:
                if not links['link']:
                    links['link'] = url

    return links


def parse_project_links(project_links_text):
    """프로젝트 관련 링크 파싱"""
    project_links = {
        'github': [],
        'link': '',
        'appStore': '',
        'googlePlayStore': '',
        'youtube': ''
    }

    if not project_links_text:
        return project_links

    # 줄바꿈이나 쉼표로 분리
    parts = re.split(r'[,\n]', project_links_text)

    for part in parts:
        part = part.strip()
        if not part:
            continue

        # GitHub 저장소 (dnd-side-project)
        if 'github.com/dnd-side-project/' in part:
            match = re.search(r'https://github\.com/dnd-side-project/[^\s,]+', part)
            if match:
                project_links['github'].append(match.group(0))
        # GitHub 일반
        elif 'github.com' in part:
            match = re.search(r'https?://github\.com/[^\s,]+', part)
            if match:
                project_links['github'].append(match.group(0))
        # App Store
        elif 'apps.apple.com' in part or 'appstore' in part.lower():
            match = re.search(r'https?://[^\s,]+', part)
            if match:
                project_links['appStore'] = match.group(0)
        # Google Play Store
        elif 'play.google.com' in part or 'playstore' in part.lower():
            match = re.search(r'https?://[^\s,]+', part)
            if match:
                project_links['googlePlayStore'] = match.group(0)
        # YouTube
        elif 'youtube.com' in part or 'youtu.be' in part:
            match = re.search(r'https?://[^\s,]+', part)
            if match:
                project_links['youtube'] = match.group(0)
        # 기타 링크
        elif part.startswith('http'):
            if not project_links['link']:
                project_links['link'] = part

    return project_links


def parse_skills(skill_text):
    """기술 스택 텍스트를 배열로 변환"""
    if not skill_text:
        return []

    # 쉼표로 분리
    skills = [s.strip() for s in skill_text.split(',')]
    return [s for s in skills if s]


def create_projects(projects_dict, last_project_id):
    """새 프로젝트 생성 (조 번호 순으로 정렬)"""
    new_projects = []
    project_id_map = {}

    # 조 번호로 정렬
    sorted_projects = sorted(projects_dict.items(), key=lambda x: int(x[1]['team_number']))

    for idx, (proj_name, proj_data) in enumerate(sorted_projects, 1):
        project_id = last_project_id + idx
        project_id_map[proj_name] = project_id

        # 프로젝트 관련 링크 파싱
        project_links = parse_project_links(proj_data['project_links'])

        # 기수 숫자 추출 (예: "14기" -> 14)
        cohort_number = re.search(r'\d+', proj_data['flag'])
        cohort_number = cohort_number.group() if cohort_number else '14'

        # 조번호
        team_number = proj_data['team_number']

        # S3 경로 생성
        s3_image_path = f"https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/images/project/{cohort_number}/{team_number}/{team_number}.png"
        s3_pdf_path = f"https://dnd-academy-v3.s3.ap-northeast-2.amazonaws.com/files/project/{cohort_number}/{team_number}/{team_number}.pdf" if proj_data['pdf'] else ""

        new_project = {
            "id": project_id,
            "name": proj_name,
            "title": proj_data['title'],
            "desc": proj_data['desc'],
            "flag": proj_data['flag'],
            "skill": parse_skills(proj_data['skills']),
            "thumbnail": s3_image_path,
            "pdf": s3_pdf_path,
            "projectLinks": {
                "appStore": project_links['appStore'],
                "github": project_links['github'],
                "googlePlayStore": project_links['googlePlayStore'],
                "youtube": project_links['youtube'],
                "link": project_links['link']
            }
        }

        new_projects.append(new_project)

    return new_projects, project_id_map


def create_reviews(all_members, project_id_map, last_review_id):
    """새 리뷰 생성"""
    new_reviews = []

    for idx, member in enumerate(all_members, 1):
        review_id = last_review_id + idx

        project_name = member['project']
        project_id = project_id_map.get(project_name)

        # 링크 파싱
        links = parse_links(member['links'])

        # 이메일 처리
        email = member['email']
        if not email and '@' in member['links']:
            # 링크에서 이메일 추출
            match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', member['links'])
            if match:
                email = match.group(0)

        new_review = {
            "id": review_id,
            "name": member['name'],
            "flag": member['flag'],
            "project": project_name,
            "projectId": project_id,
            "position": member['position'],
            "review": member['review'],
            "email": email,
            "links": links
        }

        new_reviews.append(new_review)

    return new_reviews


def print_s3_upload_guide(projects_dict, new_projects):
    """S3 업로드 안내 출력"""
    print("\n" + "=" * 80)
    print("📦 S3 업로드 안내")
    print("=" * 80)

    for proj in new_projects:
        proj_name = proj['name']
        proj_data = projects_dict[proj_name]
        team_number = proj_data['team_number']

        print(f"\n[{team_number}조] {proj_name}")
        print("-" * 80)
        print(f"팀원: {', '.join([m['name'] for m in proj_data['members']])}")
        print(f"\nGoogle Drive 이미지:")
        print(f"  {proj_data['banner']}")
        print(f"\n업로드할 S3 경로:")
        print(f"  {proj['thumbnail']}")

        if proj_data['pdf']:
            print(f"\nGoogle Drive PDF:")
            print(f"  {proj_data['pdf']}")
            print(f"\n업로드할 S3 경로:")
            print(f"  {proj['pdf']}")
        else:
            print("\n(PDF 없음)")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help']:
        print(__doc__)
        sys.exit(0)

    csv_path = sys.argv[1]

    if not Path(csv_path).exists():
        print(f"❌ CSV 파일을 찾을 수 없습니다: {csv_path}")
        sys.exit(1)

    print("=" * 80)
    print("DND 기수 업데이트 시작")
    print("=" * 80)

    # 1. CSV 파싱
    print("\n1️⃣ CSV 파싱 중...")
    projects_dict, all_members = parse_csv(csv_path)
    print(f"   ✅ {len(projects_dict)}개 프로젝트, {len(all_members)}명 팀원")

    # 2. 기존 데이터 로드
    print("\n2️⃣ 기존 데이터 로드 중...")
    with open(PROJECTS_JSON, 'r', encoding='utf-8') as f:
        existing_projects = json.load(f)
    with open(REVIEWS_JSON, 'r', encoding='utf-8') as f:
        existing_reviews = json.load(f)

    last_project_id = max(p['id'] for p in existing_projects)
    last_review_id = max(r['id'] for r in existing_reviews)
    print(f"   ✅ 마지막 프로젝트 ID: {last_project_id}")
    print(f"   ✅ 마지막 리뷰 ID: {last_review_id}")

    # 3. 새 프로젝트 생성
    print("\n3️⃣ 새 프로젝트 생성 중...")
    new_projects, project_id_map = create_projects(projects_dict, last_project_id)
    print(f"   ✅ {len(new_projects)}개 프로젝트 생성")

    # 4. 새 리뷰 생성
    print("\n4️⃣ 새 리뷰 생성 중...")
    new_reviews = create_reviews(all_members, project_id_map, last_review_id)
    print(f"   ✅ {len(new_reviews)}개 리뷰 생성")

    # 5. JSON 파일 업데이트
    print("\n5️⃣ JSON 파일 업데이트 중...")
    updated_projects = existing_projects + new_projects
    updated_reviews = existing_reviews + new_reviews

    with open(PROJECTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(updated_projects, f, ensure_ascii=False, indent=2)

    with open(REVIEWS_JSON, 'w', encoding='utf-8') as f:
        json.dump(updated_reviews, f, ensure_ascii=False, indent=2)

    print(f"   ✅ projects.json: {len(existing_projects)} → {len(updated_projects)}개")
    print(f"   ✅ reviews.json: {len(existing_reviews)} → {len(updated_reviews)}개")

    # 6. 결과 출력
    # 기수 정보 추출
    cohort = new_projects[0]['flag'] if new_projects else '14기'

    print("\n" + "=" * 80)
    print("✅ 업데이트 완료!")
    print("=" * 80)
    print(f"\n기수: {cohort}")
    print(f"추가된 프로젝트: {len(new_projects)}개")
    print(f"추가된 리뷰: {len(new_reviews)}개")
    print(f"\n프로젝트별 팀원 수:")
    for proj in new_projects:
        proj_data = projects_dict[proj['name']]
        team_number = proj_data['team_number']
        member_count = len([r for r in new_reviews if r['project'] == proj['name']])
        print(f"  - [{team_number}조] {proj['name']}: {member_count}명")

    # 7. S3 업로드 안내
    print_s3_upload_guide(projects_dict, new_projects)

    print("\n" + "=" * 80)
    print("⚠️  다음 단계:")
    print("=" * 80)
    print("Google Drive에서 파일을 다운로드하여 S3에 업로드하세요")
    print("=" * 80)


if __name__ == "__main__":
    main()
