"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/* ------------------------------------------------------------------ *
 *  Дані сцени. Весь текст — звичайні DOM-ноди, жодних псевдоелементів
 *  чи зображень, тому він є в вихідному HTML і виділяється мишкою.
 * ------------------------------------------------------------------ */

const MESSAGE = "Треба акт для клієнта зі США, оплата 12.08";
const CHAR_MS = 0.045;

const TASK_LINES = [
  { label: "Виконавець", value: "Олена К." },
  { label: "Дедлайн", value: "сьогодні до 18:00" },
  { label: "Статус", value: "в роботі" },
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

/** Серпень: 31 день, 1-е число — п'ятниця. Рівно 5 × 7 = 35 комірок. */
const FIRST_DAY_OFFSET = 4;
const DAYS_IN_MONTH = 31;
const MARKED_DAY = 12; // акт для клієнта
const SECOND_DAY = 20; // квартальний звіт

const cellIndexOf = (day: number) => day + FIRST_DAY_OFFSET - 1;
const MARKED_INDEX = cellIndexOf(MARKED_DAY);
const SECOND_INDEX = cellIndexOf(SECOND_DAY);
/** Тиждень, який залишається видимим на мобайлі */
const MOBILE_WEEK = Math.floor(MARKED_INDEX / 7);

const COUNTERS = [
  { value: 0, suffix: "", label: "нагадувань" },
  { value: 1, suffix: "", label: "повідомлення" },
  { value: 6, suffix: " год", label: "— і готово" },
];

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function ProcessAnimation() {
  const rootRef = useRef<HTMLElement | null>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // prefers-reduced-motion: залишаємо статичний фінальний стан,
    // таймлайн не створюємо взагалі.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Ставимо початковий (прихований) стан синхронно, до першого кадру,
    // щоб не блимнув статичний варіант поки вантажиться GSAP.
    root.dataset.anim = "on";

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;
    let detachVisibility: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const q = gsap.utils.selector(root);

        const typedEl = q('[data-el="typed"]')[0] as HTMLElement;
        const restEl = q('[data-el="rest"]')[0] as HTMLElement;
        const markedCell = q('[data-el="cell"]')[MARKED_INDEX] as HTMLElement;

        /* ---------- друк тексту: пишемо тільки textContent ---------- */
        let printed = -1;
        const printer = { i: 0 };
        const paint = (n: number) => {
          if (n === printed) return;
          printed = n;
          typedEl.textContent = MESSAGE.slice(0, n);
          restEl.textContent = MESSAGE.slice(n);
        };

        /* ---------- лічильники ---------- */
        const counterEls = q('[data-el="count"]') as HTMLElement[];
        const counterState = COUNTERS.map(() => ({ v: 0 }));

        // Те, що не скидається через .set() — текст і числа лічильників
        const resetCycle = () => {
          paint(0);
          counterState.forEach((s) => (s.v = 0));
          root.dataset.typing = "1";
        };

        const tl = gsap.timeline({
          repeat: -1,
          repeatDelay: 1.5,
          paused: true,
          defaults: { ease: "power3.out" },
          onRepeat: resetCycle,
        });

        /* ================= t = 0 — скидання циклу ================= */
        tl.add(resetCycle, 0)
          .set(q('[data-el="scene"]'), { opacity: 1 }, 0)
          .set(q('[data-el="bubble"]'), { opacity: 0, x: -26, y: 10, scale: 1 }, 0)
          .set(q('[data-el="ticks"]'), { opacity: 0, scale: 0.5 }, 0)
          .set(q('[data-el="card"]'), { opacity: 0, y: 24 }, 0)
          .set(q('[data-el="card-line"]'), { opacity: 0, y: 10 }, 0)
          .set(q('[data-el="cell"]'), { opacity: 0, scale: 0.8 }, 0)
          .set(markedCell, { scale: 0.8 }, 0)
          .set(q('[data-el="cell-fill"]'), { opacity: 0 }, 0)
          .set(q('[data-el="badge"]'), { opacity: 0, y: 8, scale: 0.85 }, 0)
          .set(q('[data-el="toast"]'), { opacity: 0, x: 40 }, 0)
          .set(q('[data-el="check"]'), { strokeDashoffset: 22 }, 0)
          .set(q('[data-el="counter"]'), { opacity: 0, y: 12 }, 0);

        /* ============ Такт 1 · 0.0–3.0с — набір повідомлення ============ */
        tl.to(q('[data-el="bubble"]'), { opacity: 1, duration: 0.3 }, 0)
          .to(
            printer,
            {
              i: MESSAGE.length,
              duration: MESSAGE.length * CHAR_MS,
              ease: "none",
              snap: { i: 1 },
              onUpdate: () => paint(Math.round(printer.i)),
            },
            0.15,
          )
          // щиглик відправки
          .add(() => {
            delete root.dataset.typing;
          }, 2.3)
          .to(
            q('[data-el="bubble"]'),
            { scale: 1.04, duration: 0.12, ease: "power2.out" },
            2.3,
          )
          .to(
            q('[data-el="bubble"]'),
            { scale: 1, duration: 0.2, ease: "power2.inOut" },
            2.42,
          )
          .to(
            q('[data-el="bubble"]'),
            { x: 0, y: 0, duration: 0.45, ease: "power3.out" },
            2.32,
          )
          .to(
            q('[data-el="ticks"]'),
            { opacity: 1, scale: 1, duration: 0.28, stagger: 0.07, ease: "back.out(2)" },
            2.7,
          );

        /* ============ Такт 2 · 3.0–5.0с — робот прийняв ============ */
        tl.to(
          q('[data-el="card"]'),
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
          3.0,
        ).to(
          q('[data-el="card-line"]'),
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 },
          3.25,
        );

        /* ============ Такт 3 · 5.0–7.0с — календар ============ */
        tl.to(
          q('[data-el="cell"]'),
          { opacity: 1, scale: 1, duration: 0.3, stagger: 0.015 },
          5.0,
        )
          .to(
            q('[data-el="cell-fill"]'),
            { opacity: 1, duration: 0.35, stagger: 0.25 },
            5.9,
          )
          .to(markedCell, { scale: 1.12, duration: 0.45, ease: "back.out(2.4)" }, 5.9)
          .to(
            q('[data-el="badge"]'),
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              stagger: 0.3,
              ease: "back.out(1.8)",
            },
            6.15,
          );

        /* ============ Такт 4 · 7.0–9.5с — сповіщення ============ */
        tl.to(
          q('[data-el="toast"]'),
          { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
          7.0,
        )
          .to(
            q('[data-el="check"]'),
            { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" },
            7.35,
          )
          .to(
            q('[data-el="toast"]'),
            { opacity: 0, x: 40, duration: 0.4, ease: "power2.in" },
            9.0,
          );

        /* ============ Такт 5 · 9.5–11.0с — підсумок ============ */
        tl.to(
          q('[data-el="counter"]'),
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
          9.5,
        );

        COUNTERS.forEach((c, i) => {
          tl.to(
            counterState[i],
            {
              v: c.value,
              duration: 0.9,
              ease: "power2.out",
              onUpdate: () => {
                counterEls[i].textContent = String(Math.round(counterState[i].v));
              },
            },
            9.55 + i * 0.1,
          );
        });

        tl.to(
          q('[data-el="scene"]'),
          { opacity: 0, duration: 0.6, ease: "power2.inOut" },
          10.4,
        );

        /* ---------- нескінченний м'який пульс іконки ---------- */
        const pulse = gsap.to(q('[data-el="pulse"]'), {
          scale: 1.12,
          duration: 0.9,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });

        /* ---------- запуск по скролу ---------- */
        ScrollTrigger.create({
          trigger: root,
          // секція видима приблизно на 60% висоти вьюпорта
          start: "top 60%",
          end: "bottom top",
          onEnter: () => {
            tl.play(0);
            pulse.play();
          },
          onLeave: () => {
            tl.pause();
            pulse.pause();
          },
          onEnterBack: () => {
            tl.play();
            pulse.play();
          },
          onLeaveBack: () => {
            tl.pause();
            pulse.pause();
          },
        });

        /* ---------- пауза, коли вкладка неактивна ---------- */
        const onVisibility = () => {
          if (document.hidden) {
            tl.pause();
            pulse.pause();
          } else if (ScrollTrigger.isInViewport(root, 0.2)) {
            tl.play();
            pulse.play();
          }
        };
        document.addEventListener("visibilitychange", onVisibility);
        detachVisibility = () =>
          document.removeEventListener("visibilitychange", onVisibility);
      }, root);
    })();

    return () => {
      cancelled = true;
      detachVisibility?.();
      ctx?.revert();
      delete root.dataset.anim;
      delete root.dataset.typing;
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="process"
      aria-labelledby="process-title"
      className="relative overflow-hidden px-5 py-20 md:py-28"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="mb-10 md:mb-14">
          <h2
            id="process-title"
            className="text-[28px] leading-tight font-semibold tracking-[-0.02em] md:text-[40px]"
          >
            Як це працює
          </h2>
          <p className="mt-3 max-w-xl text-[15px] text-[color:var(--ink-2)] md:text-[17px]">
            Ви пишете завдання. Далі — не ваша турбота.
          </p>
        </header>

        {/* Сцена */}
        <div data-el="scene" className="relative">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.05fr_0.95fr_1.1fr] md:gap-5">
            {/* ---------------- 1. Чат ---------------- */}
            <div className="card p-4 md:p-5">
              <div className="flex items-center gap-3 border-b border-[rgba(0,0,0,0.06)] pb-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[13px] font-semibold text-[color:var(--accent)]"
                >
                  ІМ
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-medium">
                    Ірина М.
                  </span>
                  <span className="block text-[12px] text-[color:var(--ink-3)]">
                    клієнт · онлайн
                  </span>
                </span>
              </div>

              <div className="flex min-h-[132px] flex-col justify-end pt-4">
                <div className="flex justify-end">
                  <div
                    data-el="bubble"
                    className="max-w-[86%] rounded-[16px] rounded-br-[6px] bg-[color:var(--accent-soft)] px-3.5 py-2.5 text-left"
                  >
                    <p className="text-[14px] leading-[1.45] text-[color:var(--ink)]">
                      {/* надрукована частина */}
                      <span data-el="typed">{MESSAGE}</span>
                      <span className="caret" aria-hidden="true" />
                      {/* хвіст: тримає ширину рядка, поки текст друкується */}
                      <span data-el="rest" className="rest" aria-hidden="true" />
                    </p>
                    <span className="mt-1 flex items-center justify-end gap-1">
                      <span className="text-[11px] text-[color:var(--ink-3)]">
                        14:26
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 12"
                        className="h-3 w-5 shrink-0 overflow-visible"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline data-el="ticks" points="1,6.5 4.5,10 11,2.5" />
                        <polyline data-el="ticks" points="7.5,6.5 11,10 17.5,2.5" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex h-9 flex-1 items-center rounded-full border border-[rgba(0,0,0,0.06)] bg-[#f7f8fa] px-3.5 text-[13px] text-[color:var(--ink-3)]">
                  Повідомлення
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 10h12M10 4l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </div>

            {/* ---------------- 2. Картка задачі ---------------- */}
            <div data-el="card" className="card p-4 md:p-5">
              <div className="flex items-center gap-3">
                <span
                  data-el="pulse"
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)]"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                </span>
                <h3 data-el="card-line" className="text-[15px] font-semibold">
                  Задачу зафіксовано
                </h3>
              </div>

              <dl className="mt-4 space-y-2.5">
                {TASK_LINES.map((line) => (
                  <div
                    key={line.label}
                    data-el="card-line"
                    className="flex items-baseline justify-between gap-3 border-b border-[rgba(0,0,0,0.05)] pb-2.5 last:border-0 last:pb-0"
                  >
                    <dt className="text-[13px] text-[color:var(--ink-3)]">
                      {line.label}:
                    </dt>
                    <dd className="text-right text-[13px] font-medium">
                      {line.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ---------------- 3. Календар ---------------- */}
            <div className="card p-4 md:p-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[15px] font-semibold">Серпень</h3>
                <span className="text-[12px] text-[color:var(--ink-3)]">
                  дедлайни під контролем
                </span>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-[color:var(--ink-3)]">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>

              <div className="relative mt-1.5">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - FIRST_DAY_OFFSET + 1;
                    const inMonth = day >= 1 && day <= DAYS_IN_MONTH;
                    const isMarked = i === MARKED_INDEX;
                    const isSecond = i === SECOND_INDEX;
                    const hiddenOnMobile = Math.floor(i / 7) !== MOBILE_WEEK;

                    return (
                      <div
                        key={i}
                        data-el="cell"
                        className={[
                          "relative flex aspect-square items-center justify-center rounded-[8px] text-[12px]",
                          inMonth
                            ? "text-[color:var(--ink)]"
                            : "text-[color:var(--ink-3)] opacity-40",
                          hiddenOnMobile ? "hidden md:flex" : "flex",
                        ].join(" ")}
                      >
                        {(isMarked || isSecond) && (
                          <span
                            data-el="cell-fill"
                            aria-hidden="true"
                            className={[
                              "absolute inset-0 flex items-center justify-center rounded-[8px] text-[12px] font-semibold",
                              isMarked
                                ? "bg-[color:var(--accent)] text-white"
                                : "bg-[color:var(--accent-soft)] text-[color:var(--accent)]",
                            ].join(" ")}
                          >
                            {day}
                          </span>
                        )}
                        <span className="relative">{inMonth ? day : ""}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Бейджі-пілюлі, приклеєні до дат */}
                <div className="cal-badges">
                  <div
                    className="cal-badge"
                    style={
                      {
                        "--col": MARKED_INDEX % 7,
                        "--row": Math.floor(MARKED_INDEX / 7),
                      } as React.CSSProperties
                    }
                  >
                    <span
                      data-el="badge"
                      className="inline-flex origin-left items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1 text-[11px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]"
                      />
                      <span className="text-[color:var(--ink-3)] md:hidden">12.08</span>
                      Акт для клієнта
                    </span>
                  </div>

                  <div
                    className="cal-badge"
                    style={
                      {
                        "--col": SECOND_INDEX % 7,
                        "--row": Math.floor(SECOND_INDEX / 7),
                      } as React.CSSProperties
                    }
                  >
                    <span
                      data-el="badge"
                      className="inline-flex origin-left items-center gap-1.5 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-2.5 py-1 text-[11px] font-medium shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--ink-3)]"
                      />
                      <span className="text-[color:var(--ink-3)] md:hidden">20.08</span>
                      Звіт за II квартал
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------------- 4. Тост ---------------- */}
          <div
            data-el="toast"
            role="status"
            className="pointer-events-none absolute top-0 right-0 z-10 flex max-w-[calc(100%-16px)] items-center gap-3 rounded-[16px] border border-[rgba(0,0,0,0.06)] bg-white px-3.5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.06)] md:top-[-14px] md:right-[-6px]"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent)]"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
                <path
                  data-el="check"
                  d="M5 12.5 L9.5 17 L19 7"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="22"
                />
              </svg>
            </span>
            <span>
              <span className="block text-[13px] font-medium">
                Готово. Акт у вашій папці
              </span>
              <span className="block text-[11px] text-[color:var(--ink-3)]">14:32</span>
            </span>
          </div>

          {/* ---------------- 5. Підсумок ---------------- */}
          <ul className="mt-5 flex flex-col gap-2 md:mt-6 md:flex-row md:gap-3">
            {COUNTERS.map((c) => (
              <li
                key={c.label}
                data-el="counter"
                className="card flex items-baseline gap-2 px-4 py-3 md:flex-1"
              >
                <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] text-[color:var(--accent)]">
                  <span data-el="count">{c.value}</span>
                  {c.suffix}
                </span>
                <span className="text-[13px] text-[color:var(--ink-2)]">{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
