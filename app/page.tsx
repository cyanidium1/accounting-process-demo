import dynamic from "next/dynamic";

// Ліниве підвантаження секції окремим чанком.
// SSR лишається увімкненим: до гідрації видно той самий статичний фінальний
// стан сцени, тому стрибка немає, а текст є у вихідному HTML.
const ProcessAnimation = dynamic(
  () => import("@/components/sections/ProcessAnimation"),
);

export default function Home() {
  return (
    <main>
      {/* Невеликий хіро, щоб секція вмикалась саме по скролу */}
      <section className="px-5 pt-24 pb-28 md:pt-36 md:pb-40">
        <div className="mx-auto max-w-[1120px]">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(0,0,0,0.06)] bg-white px-3 py-1.5 text-[12px] text-[color:var(--ink-2)]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]"
            />
            Бухгалтерія на аутсорсі
          </p>
          <h1 className="max-w-3xl text-[34px] leading-[1.1] font-semibold tracking-[-0.03em] md:text-[56px]">
            Бухгалтерія, яка не питає вас двічі
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-[color:var(--ink-2)] md:text-[18px]">
            Первинка, звітність, ЗЕД-контракти й дедлайни — на нашому боці.
            Ви залишаєтесь у своєму месенджері.
          </p>
          <p className="mt-10 text-[13px] text-[color:var(--ink-3)]">
            Прокрутіть нижче ↓
          </p>
        </div>
      </section>

      <ProcessAnimation />

      {/* Запас скролу, щоб секція могла повністю піти з екрана — тоді
          ScrollTrigger ставить таймлайн на паузу */}
      <section className="px-5 pt-16 pb-[110vh]">
        <div className="mx-auto max-w-[1120px]">
          <p className="text-[13px] text-[color:var(--ink-3)]">
            Демо-секція процесу. Анімація стартує при 60% видимості блока,
            зациклюється з паузою 1,5 с і зупиняється, коли секція йде з екрана.
          </p>
        </div>
      </section>
    </main>
  );
}
