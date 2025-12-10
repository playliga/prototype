/**
 * Contains localized template strings used for
 * dynamic content generation. These templates
 * are rendered using Squirrelly.
 *
 * Used primarily for generating emails and
 * rich-text messages within the application.
 *
 * @module
 */

/** @enum */
export enum AwardTypeChampion {
  SUBJECT = 'Glückwunsch {{it.profile.team.name}}!',
  CONTENT = `
  Hallo, {{it.profile.player.name}}!

  Herzlichen Glückwunsch zum Gewinn des **{{it.competition}}**!

  Gute Arbeit, mach weiter so!
  `,
}

/** @enum */
export enum AwardTypePromotion {
  SUBJECT = 'Immer weiter hoch!',
  CONTENT = `
  Hallo, {{it.profile.player.name}}!

  Herzlichen Glückwunsch zum Aufstieg aus der **{{it.competition}}**!

  Nächste Saison spielen wir in einer schwierigeren Liga, also müssen wir unser Bestes geben!
  `,
}

/** @enum */
export enum AwardTypeQualify {
  SUBJECT = 'Qualified!',
  CONTENT = `
  Hey, {{it.profile.player.name}}!

  Gute Arbeit, du hast dich von **{{it.competition}}** zur nächsten Runde qualifiziert!

  Von hier an wird es nur noch schwieriger werden.
  `,
}

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hallo, {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Der Spieler, **{{it.transfer.target.name}}**, wurde an {{it.transfer.from.name}} verkauft.
  {{#else}}
  Ich teile dir hiermit mit, dass **{{it.transfer.target.name}}** unser Angebot angenommen hat.

  Jetzt können wir ihn in unserem Team einsetzen!
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  Das Angebot ist für uns befriedigend. Nun liegt es an **{{it.transfer.target.name}}**, ob er das vorgeschlagene Gehalt annimmt.
  `,
}

/** @enum */
export enum OfferAcceptedUser {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `{{it.transfer.from.name}}'s Angebot angenommen.`,
}

/** @enum */
export enum OfferGeneric {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = '',
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hello, {{it.profile.player.name}}.

  **{{it.transfer.from.name}}** sind an einem Transfer für **{{it.transfer.target.name}}** interessiert.

  Die Details lauten wie folgt:

  - Transfer Summe: {{it.transfer.offers[0].cost | currency}}

  - Gehalt: {{it.transfer.offers[0].wages | currency}}

  ---

  <button className="btn btn-primary" data-ipc-route="/transfer/accept" data-payload="{{it.transfer.id}}">Accept Offer</button>
  <button className="btn btn-ghost" data-ipc-route="/transfer/reject" data-payload="{{it.transfer.id}}">Reject Offer</button>
  `,
}

/** @enum */
export enum OfferRejectedEmailCost {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Wir sind nicht bereit, den Spieler für so eine niedrige Summe zu verkaufen.
  `,
}

/** @enum */
export enum OfferRejectedEmailRelocate {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hi {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Die Gespräche zwischen dem Spieler **{{it.transfer.from.name}}** sind gescheitert, da er nicht bereit ist, die Region zu wechseln.
  {{#else}}
  Der Spieler hat Ihr Angebot abgelehnt, da er nicht bereit ist, die Region zu wechseln.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedEmailSquadDepth {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hallo {{it.profile.player.name}},

  Wir sind nicht bereit, diesen Spieler zu verkaufen, da er für unseren Kader von entscheidender Bedeutung ist.
  `,
}

/** @enum */
export enum OfferRejectedEmailUnlisted {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Wir sind nicht bereit den Spieler zu verkaufen, da er nicht zum Transfer steht.
  `,
}

/** @enum */
export enum OfferRejectedEmailWages {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Die Gespräche zwischen dem Spieler und **{{it.transfer.from.name}}** sind gescheitert, weil sie sich nicht über das Gehalt einigen konnten.
  {{#else}}
  Der Spieler hat Ihr Angebot abgelehnt, weil er das angebotene Gehalt als zu niedrig empfindet.

  Wir müssen für diesen Spieler möglicherweise etwas mehr ausgeben, falls wir es uns leisten können.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Transfer Angebot für {{it.transfer.target.name}}',
  CONTENT = `{{it.transfer.from.name}}'s Angebot abgelehnt.`,
}

/** @enum */
export enum SponsorshipAccepted {
  SUBJECT = 'Sponsoring-Angebot für {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  Gute Nachrichten! **{{it.sponsorship.sponsor.name}}** hat unseren Sponsoringantrag angenommen und wird uns künftig unterstützen.
  `,
}

/** @enum */
export enum SponsorshipBonuses {
  SUBJECT = 'Sponsoring-Angebot für {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey, {{it.profile.player.name}}.

  Gute Arbeit diese Saison! **{{it.sponsorship.sponsor.name}}** ist mit der Leistung Ihres Teams zufrieden und hat die folgenden Boni vergeben:

  {{@each(it.bonuses) => bonus}}
  - {{bonus}}
  {{/each}}
  `,
}

/** @enum */
export enum SponsorshipGeneric {
  SUBJECT = 'Sponsoring-Angebot für {{it.sponsorship.sponsor.name}}',
  CONTENT = '',
}

/** @enum */
export enum SponsorshipInvite {
  SUBJECT = 'Tourniereinladung von {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  Wir haben eine Einladung zur Teilnahme an **{{it.idiomaticTier}}** erhalten, dank unseres Sponsors **{{it.sponsorship.sponsor.name}}**.

  Deine Entscheidung - Lass mich wissen, ob du daran teilnehmen möchtest.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/invite/accept" data-payload="{{it.sponsorship.id}}">Accept Invite</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/invite/reject" data-payload="{{it.sponsorship.id}}">Reject Invite</button>
  `,
}

/** @enum */
export enum SponsorshipInviteAcceptedUser {
  SUBJECT = 'Turniereinladung von {{it.sponsorship.sponsor.name}}',
  CONTENT = "{{it.sponsorship.sponsor.name}}'s Einladung angenommen.",
}

/** @enum */
export enum SponsorshipInviteRejectedUser {
  SUBJECT = 'Turniereinladung von {{it.sponsorship.sponsor.name}}',
  CONTENT = "{{it.sponsorship.sponsor.name}}'s Einladung abgelehnt.",
}

/** @enum */
export enum SponsorshipRejectedTier {
  SUBJECT = 'Sponsoring-Angebot für {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Leider hat **{{it.sponsorship.sponsor.name}}** unser Sponsoringantrag abgelehnt, da wir die Mindestanforderungen für die Liga nicht erfüllen.
  `,
}

/** @enum */
export enum SponsorshipRenew {
  SUBJECT = 'Sponsoring-Angebot für {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  Ihr Vertrag mit **{{it.sponsorship.sponsor.name}}** ist ausgelaufen, jedoch ist dieser daran interessiert die Partnerschaft mit uns fortzusetzen.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/renew/accept" data-payload="{{it.sponsorship.id}}">Accept</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/renew/reject" data-payload="{{it.sponsorship.id}}">Reject</button>
  `,
}

/** @enum */
export enum SponsorhipRenewAcceptedUser {
  SUBJECT = 'Sponsoring-Angebot für  {{it.sponsorship.sponsor.name}}',
  CONTENT = `{{it.sponsorship.sponsor.name}}'s Angebot angenommen.`,
}

/** @enum */
export enum SponsorhipRenewRejectedUser {
  SUBJECT = 'Sponsoring-Angebot für  {{it.sponsorship.sponsor.name}}',
  CONTENT = `{{it.sponsorship.sponsor.name}}'s Angebot abgelehnt.`,
}

/** @enum */
export enum SponsorshipTerminated {
  SUBJECT = 'Sponsoring-Angebot für  {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  Unsere Leistung war in letzter Zeit laut **{{it.sponsorship.sponsor.name}}** nicht akzeptabel. Unser Sponsoringvertrag wurde daher aufgrund nicht erfüllter Vertragsbedingungen beendet.

  Hier sind die nicht erfüllten Bedingungen:

  {{@each(it.requirements) => requirement}}
  - {{requirement}}
  {{/each}}
  `,
}

/** @enum */
export enum WelcomeEmail {
  SUBJECT = 'Hey!',
  CONTENT = `
  Hi, {{it.profile.player.name}}!

  Mein Name ist {{it.persona.name}} und ich bin dein Assistenzmanager. Ich wollte mich nur kurz vorstellen.

  Unser erstes Spiel steht gleich an, deshalb wollte ich dir ein paar Tipps geben.

  - Sobald du im Spiel bist, kannst du im Chat \`.ready\` eingeben, und das Spiel startet sofort.
  - Du kannst auch warten, bis der Aufwärmtimer abgelaufen ist.
  - Nach dem Spiel kannst du das Spiel schließen, da das Ergebnis automatisch gespeichert wird.

  GL HF!
  `,
}
