import { useMemo } from 'react';
import { useStore } from '../store';
import { computeConquest, formatYear } from '../lib/conquest';
import { hrefFor } from '../lib/util';
import Passport from './Passport';

export default function Conquest() {
  const { books, data } = useStore();
  const c = useMemo(() => computeConquest(books, data), [books, data]);
  const earned = c.titles.filter((t) => t.earned);

  return (
    <div className="page conquest">
      <div className="eyebrow">World conquest · 책으로 정복한 세계</div>
      <h1 className="page-title" style={{ marginTop: 6 }}>
        책으로 다녀온 세계
      </h1>
      <p className="lede">내 책장에 기록한 장소와 시대만으로 계산해요. 아직 근거를 확인하지 않은 연결도 정복지에 포함되니, 상세에서 근거 상태를 함께 봐 주세요.</p>

      <Passport missingContinents={c.missingContinents} countries={c.countries.length} continents={c.continents.size} oldest={c.oldest} newest={c.newest} />

      <dl className="stat-grid">
        <div>
          <dt>나라</dt>
          <dd className="tnum">{c.countries.length}</dd>
        </div>
        <div>
          <dt>도시·장소</dt>
          <dd className="tnum">{c.cityCount}</dd>
        </div>
        <div>
          <dt>대륙</dt>
          <dd className="tnum">
            {c.continents.size}
            <small>/6</small>
          </dd>
        </div>
        <div className="wide">
          <dt>시간 폭</dt>
          <dd className="ko" style={{ fontSize: 28 }}>
            {c.oldest != null && c.newest != null ? `${formatYear(c.oldest)} → ${formatYear(c.newest)}` : '시대 확인 중'}
          </dd>
        </div>
      </dl>
      <div className="actions" style={{ margin: '20px 0 8px' }}>
        <a className="action primary" href="#/?layer=conquest">
          정복 지도로 보기
        </a>
        {c.unmappedCount > 0 && (
          <a className="action" href="#/library">
            지도 밖의 책 {c.unmappedCount}권 보기
          </a>
        )}
      </div>

      <h2 className="section-title">정복한 나라</h2>
      <ol className="country-list">
        {c.countries.map((x, i) => (
          <li key={x.code}>
            <span className="rank tnum">{String(i + 1).padStart(2, '0')}</span>
            <span className="ko name">{x.name}</span>
            <span className="meta">{x.continent ?? ''}</span>
            <span className="meta tnum">{x.books}권</span>
          </li>
        ))}
      </ol>
      {c.missingContinents.length > 0 && (
        <p className="notice" role="note">
          <span className="prose">
            아직 깃발을 꽂지 못한 대륙 · <strong>{c.missingContinents.join(', ')}</strong>. 이곳이 배경인 책을 읽었다면 추가해 보세요.
          </span>
          <a className="link-btn" href="#/add" style={{ minHeight: 28 }}>
            읽은 책 추가
          </a>
        </p>
      )}

      <h2 className="section-title">원정 코스</h2>
      <p className="help" style={{ marginTop: -6, marginBottom: 12 }}>
        내 책장에서 같은 장소·시대·사상가로 이어지는 책을 시대순으로 묶었어요. 지도에서 한 걸음씩 따라가 보세요.
      </p>
      <div className="grid-2">
        {c.courses.map((course) => (
          <article key={course.id} className="card course-card">
            <div className="eyebrow">{{ city: '도시 원정', era: '시대 원정', thinker: '사상가 루트', fictional: '가상 장소 순례' }[course.kind]}</div>
            <h3 className="ko">{course.title}</h3>
            <p className="meta">{course.subtitle}</p>
            <ol className="course-preview">
              {course.steps.slice(0, 4).map((s) => (
                <li key={s.link.id} className="ko">
                  {s.book.work.canonicalTitle}
                  {s.time?.startYear != null && <span className="meta"> · {formatYear(s.time.startYear)}</span>}
                </li>
              ))}
              {course.steps.length > 4 && <li className="meta">외 {course.steps.length - 4}권</li>}
            </ol>
            <a className="arrow-link" href={hrefFor({ name: 'course', courseId: course.id })}>
              지도에서 원정 시작 <span className="arrow" aria-hidden>→</span>
            </a>
          </article>
        ))}
      </div>

      <h2 className="section-title">칭호</h2>
      <p className="help" style={{ marginTop: -6, marginBottom: 12 }}>
        {earned.length}개 획득 · 기록이 쌓이면 잠긴 칭호가 열려요.
      </p>
      <ul className="title-list">
        {c.titles.map((t) => (
          <li key={t.name} className={t.earned ? 'earned' : 'locked'}>
            <span className="t ko">{t.name}</span>
            <span className="meta ko">{t.earned ? t.why : `조건 · ${t.why}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
