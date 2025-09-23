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
  SUBJECT = 'Congratulazioni {{it.profile.team.name}}!',
  CONTENT = `
  Ciao, {{it.profile.player.name}}!

  Complimenti per aver vinto **{{it.competition}}**!

  Continua così!
  `,
}

/** @enum */
export enum AwardTypePromotion {
  SUBJECT = 'Siamo promossi!',
  CONTENT = `
  Ciao, {{it.profile.player.name}}!

  Ben fatto ad aver ottenuto la promozione da **{{it.competition}}**!

  Prossima stagione giocheremo in una divisione più tosta quindi dovremo dare il meglio!
  `,
}

/** @enum */
export enum AwardTypeQualify {
  SUBJECT = 'Qualificati!',
  CONTENT = `
  Hey, {{it.profile.player.name}}!

  Ben fatto per la qualificazione dal **{{it.competition}}** e proseguiamo per il prossimo round!

  D'ora in poi sarà sempre più difficile.
  `,
}

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Ciao, {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Il giocatore, **{{it.transfer.target.name}}**, è stato venduto a {{it.transfer.from.name}}.
  {{#else}}
  Ho il piacere di informarti che **{{it.transfer.target.name}}** ha accettato la nostra offerta.

  Non vede l'ora di mostrare le sue abilità!
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Ciao, {{it.profile.player.name}}.

  Quell'offerta va bene per noi. Adesso sta a **{{it.transfer.target.name}}** se decide di accettare lo stipendio proposto.
  `,
}

/** @enum */
export enum OfferAcceptedUser {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `Accettata l'offerta di {{it.transfer.from.name}}'`,
}

/** @enum */
export enum OfferGeneric {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = '',
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Ciao, {{it.profile.player.name}}.

  **{{it.transfer.from.name}}** sono interessati in un trasferimento per **{{it.transfer.target.name}}**.

  I dettagli sono qui sotto:

  - Offerta Trasferimento: {{it.transfer.offers[0].cost | currency}}

  - Stipendio: {{it.transfer.offers[0].wages | currency}}

  ---

  <button className="btn btn-primary" data-ipc-route="/transfer/accept" data-payload="{{it.transfer.id}}">Accept Offer</button>
  <button className="btn btn-ghost" data-ipc-route="/transfer/reject" data-payload="{{it.transfer.id}}">Reject Offer</button>
  `,
}

/** @enum */
export enum OfferRejectedEmailCost {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Non siamo disposti a vendere il nostro giocatore ad una cifra irrisoria.
  `,
}

/** @enum */
export enum OfferRejectedEmailRelocate {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Ciao {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Le trattative tra il giocatore e **{{it.transfer.from.name}}** sono fallite perchè non ha intenzione di cambiare regione.
  {{#else}}
  Il giocatore ha rifiutato la tua offerta perchè non è intenzionato a cambiare regione.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedEmailSquadDepth {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Ciao {{it.profile.player.name}},

  Non abbiamo intenzione di cedere questo giocatore in quanto fondamentale per la nostra squadra.
  `,
}

/** @enum */
export enum OfferRejectedEmailUnlisted {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Non abbiamo intenzione di cedere questo giocatore in quanto non è in lista trasferimenti.
  `,
}

/** @enum */
export enum OfferRejectedEmailWages {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Le trattative tra il giocatore e **{{it.transfer.from.name}}** sono fallite perchè non sono riusciti a concordare lo stipendio.
  {{#else}}
  Il giocatore ha rifiutato la tua offerta perchè a quanto dicono lo stipendio offerto era troppo basso.

  Dovremmo spendere di più per questo giocatore, se possiamo permettercelo.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Offerta di trasferimento per {{it.transfer.target.name}}',
  CONTENT = `Rifiutata l'offerta di {{it.transfer.from.name}}'.`,
}

/** @enum */
export enum SponsorshipAccepted {
  SUBJECT = 'Offerta di sponsorizzazione per {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Ciao, {{it.profile.player.name}}.

  Ottime Notizie! **{{it.sponsorship.sponsor.name}}** ha accettato la nostra domanda per lo sponsor e ci supporteranno d'ora in avanti.
  `,
}

/** @enum */
export enum SponsorshipBonuses {
  SUBJECT = 'Offerta di sponsorizzazione per {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey, {{it.profile.player.name}}.

  Ottimo lavoro questa stagione! **{{it.sponsorship.sponsor.name}}** è soddisfatta delle prestazioni della squadra e ,come concordato, otteniamo i seguenti bonus:

  {{@each(it.bonuses) => bonus}}
  - {{bonus}}
  {{/each}}
  `,
}

/** @enum */
export enum SponsorshipGeneric {
  SUBJECT = 'Offerta di sponsorizzazione per {{it.sponsorship.sponsor.name}}',
  CONTENT = '',
}

/** @enum */
export enum SponsorshipInvite {
  SUBJECT = 'Invito al Torneo per {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  Abbiamo ricevuto un invito per competere in **{{it.idiomaticTier}}**, cortesia del nostro sponsor **{{it.sponsorship.sponsor.name}}**.

  La chiamata è tua—Fammi sapere se ritieni che dovremmo accettare.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/invite/accept" data-payload="{{it.sponsorship.id}}">Accept Invite</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/invite/reject" data-payload="{{it.sponsorship.id}}">Reject Invite</button>
  `,
}

/** @enum */
export enum SponsorshipInviteAcceptedUser {
  SUBJECT = 'Invito al Torneo per {{it.sponsorship.sponsor.name}}',
  CONTENT = "Accettato l'invito di {{it.sponsorship.sponsor.name}}'.",
}

/** @enum */
export enum SponsorshipInviteRejectedUser {
  SUBJECT = 'Invito al Torneo per {{it.sponsorship.sponsor.name}}',
  CONTENT = "Rifiutato l'invito di {{it.sponsorship.sponsor.name}}'.",
}

/** @enum */
export enum SponsorshipRejectedTier {
  SUBJECT = 'Offerta di sponsorizzazione a {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Purtroppo, **{{it.sponsorship.sponsor.name}}** ha rifiutato la nostra offerta di sponsorizzazione in quanto non rispettiamo i loro requisiti minimi per la divisione di lega.
  `,
}

/** @enum */
export enum SponsorshipRenew {
  SUBJECT = 'Offerta di sponsorizzazione a {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  Il tuo contratto è scaduto con **{{it.sponsorship.sponsor.name}}**, tuttavia, sono felici di continuare la collaborazione con noi.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/renew/accept" data-payload="{{it.sponsorship.id}}">Accept</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/renew/reject" data-payload="{{it.sponsorship.id}}">Reject</button>
  `,
}

/** @enum */
export enum SponsorhipRenewAcceptedUser {
  SUBJECT = 'Offerta di sponsorizzazione per {{it.sponsorship.sponsor.name}}',
  CONTENT = `Accettata l'offerta di {{it.sponsorship.sponsor.name}}'.`,
}

/** @enum */
export enum SponsorhipRenewRejectedUser {
  SUBJECT = 'Offerta di sponsorizzazione a {{it.sponsorship.sponsor.name}}',
  CONTENT = `Rifiutata l'offerta di {{it.sponsorship.sponsor.name}}'.`,
}

/** @enum */
export enum SponsorshipTerminated {
  SUBJECT = 'Offerta di sponsorizzazione per {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Ciao, {{it.profile.player.name}}.

  C'è stato un'imprevisto—**{{it.sponsorship.sponsor.name}}** ha deciso di terminare la sponsorizzazione a causa di requisiti di contratto insoddisfatti.

  Abbiamo fallito in questo:

  {{@each(it.requirements) => requirement}}
  - {{requirement}}
  {{/each}}
  `,
}

/** @enum */
export enum WelcomeEmail {
  SUBJECT = 'Hey!',
  CONTENT = `
  Ciao, {{it.profile.player.name}}!

  Mi chiamo {{it.persona.name}} e sono il tuo assistente manageriale. Volevo soltanto salutarti e presentarmi.

  La nostra prima partita è in arrivo perciò volevo farti sapere riguardo un paio di cose.

  - Una volta in-gioco puoi scrivere \`.ready\` nella chat e la partita inizierà immediatamente.
  - Puoi anche aspettare che il timer di riscaldamento finisca.
  - Finita la partita, puoi chiudere il gioco in quanto il punteggio verrà automaticamente registrato.

  Buona fortuna, divertiti!
  `,
}
