import Link from "next/link";

export const dynamic = "force-dynamic";

export default function StudentGuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/student"
          className="text-xs font-medium text-ink-500 transition hover:text-ink-900"
        >
          ← Back to your stories
        </Link>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          How it works
        </h1>
        <p className="mt-2 text-sm text-ink-600">
          A quick guide to reading, recording, and earning stars.
        </p>
      </div>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            1
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Open a story
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          On your dashboard you&rsquo;ll see the stories your teacher has given
          you. Tap one to open it. Each story has a few scenes, each with a
          picture and a sentence.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            2
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Listen first
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          Tap the{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-medium text-white">
            <span aria-hidden>▶</span> Listen
          </span>{" "}
          button to hear a native speaker read the sentence. You can tap it as
          many times as you like.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            3
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Record yourself
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          When you&rsquo;re ready, tap{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-0.5 text-xs font-medium text-white">
            <span aria-hidden>●</span> Record
          </span>
          , say the sentence out loud, then tap <strong>Stop</strong>. You have
          up to 30 seconds. Speak clearly into the microphone — a quiet room
          helps the most.
        </p>
        <p className="text-xs text-ink-500">
          The first time you record, your phone or browser will ask for
          microphone permission. Tap <strong>Allow</strong>.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            4
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Meet Coach Miss Luna
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          After you record, your <strong>Virtual Coach Miss Luna</strong>{" "}
          listens and gives you:
        </p>
        <ul className="space-y-2 text-sm text-ink-700">
          <li className="flex gap-2">
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-emerald-100 px-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
              5 / 5
            </span>
            <span>
              A <strong>score out of 5</strong> — how clearly you read the
              sentence.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="mt-0.5">
              💬
            </span>
            <span>
              A <strong>one-line tip</strong> — a specific sound or word to
              work on next time.
            </span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="mt-0.5">
              👂
            </span>
            <span>
              A <strong>heard transcript</strong> — the exact words Miss Luna
              heard you say.
            </span>
          </li>
        </ul>
        <p className="text-xs text-ink-500">
          Miss Luna usually takes 5&ndash;15 seconds. You&rsquo;ll see
          &ldquo;Miss Luna is listening&hellip;&rdquo; while she thinks.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            5
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Try again &mdash; it&rsquo;s fine!
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          Not happy with your score? Just tap <strong>Record</strong> again.
          Your new recording replaces the old one and Miss Luna will give you
          fresh feedback. Practise until it feels great.
        </p>
      </section>

      <section className="card space-y-3 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-brand-700 font-semibold">
            6
          </span>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            Stars and the leaderboard
          </h2>
        </div>
        <p className="text-sm text-ink-700">
          When you finish all the scenes in a story, your teacher can award
          your story up to <strong>5 stars</strong> (half-stars too!). Stars
          add up on the leaderboard on your dashboard. Your own row is
          highlighted so you can see how you&rsquo;re doing.
        </p>
      </section>

      <section className="card space-y-3 bg-gradient-to-br from-brand-50 via-white to-accent-50 p-6">
        <h2 className="font-display text-xl tracking-tight text-ink-900">
          Tips for a better score
        </h2>
        <ul className="space-y-2 text-sm text-ink-700">
          <li>
            <strong>Listen twice before you record.</strong> The more you
            hear it, the easier it is to copy.
          </li>
          <li>
            <strong>Read every word.</strong> Missing words hurt your score
            more than a small mispronunciation.
          </li>
          <li>
            <strong>Speak clearly, not loudly.</strong> Miss Luna needs to hear
            the sounds, not the volume.
          </li>
          <li>
            <strong>Find a quiet spot.</strong> Background noise makes it
            harder for Miss Luna to hear you.
          </li>
          <li>
            <strong>Read the tip carefully.</strong> Miss Luna tells you the
            exact sound to fix &mdash; focus on just that next time.
          </li>
        </ul>
      </section>

      <div className="flex justify-center">
        <Link href="/student" className="btn-primary">
          Back to your stories
        </Link>
      </div>
    </div>
  );
}
