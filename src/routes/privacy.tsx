import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand, Eyebrow, Footer } from "@/components/kolli/Brand";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy notice — Kolli" },
      { name: "description", content: "How Kolli handles your display name, matches, chat messages, ratings and reports." },
      { property: "og:title", content: "Privacy notice — Kolli" },
      { property: "og:description", content: "How Kolli handles your display name, matches, chat messages, ratings and reports." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

const SECTIONS: [string, string[]][] = [
  ["1. Who is responsible?", ["The person or entity operating Kolli determines why and how Kolli processes personal data and is the data controller for this service. The operator’s name, postal address, and privacy contact must be published here before collecting data from real users. Until that information is added, do not use Kolli with real personal data. You can also contact the Office of the Data Protection Commissioner (ODPC) at odpc.go.ke."]],
  ["2. Who can use Kolli?", ["Kolli is intended for adults aged 18 and over. Guest registration asks you to confirm that you are at least 18. Do not use the service if you are under 18. Kolli is not designed to collect children’s personal data."]],
  ["3. Data we process and why", [
    "Account and guest details: display name and guest/account status. We use these to sign you in and show your identity to your match.",
    "Watch activity: titles selected, match participants, session dates/status, Kosmi invite link, and party count. We use these to find a match, operate the shared room flow, and support feedback.",
    "Messages: chat text and sender details are stored to deliver chat.",
    "Ratings and reports: ratings, optional comments, and any safety reports you submit are used for community safety, feedback, and moderation.",
    "Title ratings: your private movie and TV ratings and their genres are used to personalize recommendations. Catalog details and community scores come from TMDB; Kolli does not send your display name or private ratings to TMDB.",
    "Technical data: standard server logs and request metadata may be processed to operate, secure, and troubleshoot the service.",
    "Do not put sensitive personal information (including health, biometrics, identity numbers, location, or financial details) in your display name, chat, or rating.",
  ]],
  ["4. Lawful basis and choice", ["Kolli should process only what is necessary for the service you request, for legal obligations, or for a documented legitimate interest that does not override your rights. Where consent is the appropriate basis, Kolli will request a free, specific, informed, and affirmative choice and let you withdraw it. The 18+ and privacy-notice checkboxes confirm those actions; they are recorded with the notice version and time and are not blanket consent for unrelated uses."]],
  ["5. Who receives data?", ["Your display name, the selected title, and messages are shared with your matched party. A Kosmi room invite link is visible to both matched users; do not share a private invite link unless you are comfortable with that. Kolli relies on hosting/database providers, and Kosmi for watch rooms. Those services process data under their own terms and privacy notices. Kolli does not sell personal data or use it for targeted advertising."]],
  ["6. Transfers outside Kenya", ["Service providers may process or store data outside Kenya. Before enabling a provider, Kolli’s operator must identify the destination and provider, establish a lawful transfer mechanism and appropriate safeguards under Kenyan law, and provide any required information or obtain any required consent."]],
  ["7. Retention", ["Guest accounts and watch history are retained until you request deletion. Match lobbies are available for eight hours after a session is created. Ratings and safety reports may be retained while needed for community safety, resolving disputes, or legal obligations, then deleted or anonymised. Backups and provider logs may persist for their documented rotation periods."]],
  ["8. Your rights", ["Subject to the Data Protection Act, 2019, you may request information about your data, access a copy, correction, deletion, restriction or objection where applicable, withdraw consent where processing relies on consent, and complain to the ODPC. Use the account menu in Kolli to download a copy of your Kolli data or delete your account.", "Account deletion removes Kolli account, match, message, rating, report, and queue records associated with that account. Other people’s independent copies, legal retention requirements, and data already handled by external providers may not be erased by this action."]],
  ["9. Security and breaches", ["Kolli uses access controls and reasonable technical and organisational measures, but no internet service can guarantee absolute security. If a personal data breach occurs, the controller will assess and notify the ODPC and affected people within the periods and in the circumstances required by the Act, including the applicable 72-hour notification requirement where it applies."]],
  ["10. Changes and complaints", ["We will update this notice when the service or its data practices change and show the latest revision date here. If you are not satisfied with our response, you may lodge a complaint with the ODPC."]],
];

function Privacy() {
  return (
    <div className="min-h-screen">
      <header className="flex h-20 items-center justify-between border-b border-foreground/10 px-[7%]">
        <Brand />
        <Link to="/" className="text-sm font-semibold">Back to Kolli ↗</Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Eyebrow>YOUR DATA, YOUR CHOICE</Eyebrow>
        <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tighter">Privacy <span className="font-serif font-normal italic text-accent">notice.</span></h1>
        <p className="mt-3 text-xs text-muted-foreground">Last updated: 16 October 2026</p>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">This notice describes how Kolli handles personal data in line with Kenya’s Data Protection Act, 2019, and applicable regulations. It is a product notice, not a substitute for legal advice.</p>
        {SECTIONS.map(([h, ps]) => (
          <section key={h} className="mt-8">
            <h2 className="font-display text-lg font-bold">{h}</h2>
            {ps.map((p) => <p key={p.slice(0, 20)} className="mt-2 text-sm leading-relaxed text-muted-foreground">{p}</p>)}
          </section>
        ))}
      </main>
      <Footer />
    </div>
  );
}
