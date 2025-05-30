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
  SUBJECT = 'Félicitations {{it.profile.team.name}} !',
  CONTENT = `
  Salut {{it.profile.player.name}} !

  Bravo pour ta magnifique victoire en **{{it.competition}}** !

  Continue comme ça, tu fais du très bon boulot !
  `,
}

/** @enum */
export enum AwardTypePromotion {
  SUBJECT = 'En avant la promotion !',
  CONTENT = `
  Salut {{it.profile.player.name}}!

  Bravo pour ton excellent travail en **{{it.competition}}**, on a réussi à obtenir une promotion en division supérieure !

  Pour la prochaine saison, il faudra s'attendre à une compétition plus rude. On va faire de notre mieux, mais on va y arriver, courage !
  `,
}

/** @enum */
export enum AwardTypeQualify {
  SUBJECT = 'On est qualifiés !',
  CONTENT = `
  Salut {{it.profile.player.name}} !

  Bravo pour cette qualification en **{{it.competition}}** qui nous permet d'avancer au prochain round !

  On s'attend à des matchs plus difficiles, mais on y croit !
  `,
}

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  **{{it.transfer.target.name}}** a été transféré(e) chez {{it.transfer.from.name}}.
  {{#else}}
  J'ai le plaisir de t'annoncer que **{{it.transfer.target.name}}** a accepté notre offre !

  On peut désormais l'intégrer dans notre roster, si tu le souhaites, bien entendu.
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  L'offre que tu nous a proposé nous convient. **{{it.transfer.target.name}}** nous donnera sa décision par rapport au salaire que tu viens de lui proposer.
  `,
}

/** @enum */
export enum OfferAcceptedUser {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `Offre acceptée pour {{it.transfer.from.name}}.`,
}

/** @enum */
export enum OfferGeneric {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = '',
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  **{{it.transfer.from.name}}** est intéressée par **{{it.transfer.target.name}}** et nous propose une offre de transfert.

  Voici les détails de l'offre :

  - Frais de transfert : {{it.transfer.offers[0].cost | currency}}

  - Salaire : {{it.transfer.offers[0].wages | currency}}

  ---

  <button className="btn btn-primary" data-ipc-route="/transfer/accept" data-payload="{{it.transfer.id}}">Accepter l'offre</button>
  <button className="btn btn-ghost" data-ipc-route="/transfer/reject" data-payload="{{it.transfer.id}}">Rejeter l'offre</button>
  `,
}

/** @enum */
export enum OfferRejectedEmailCost {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  Désolé, mais nous ne pouvons pas accepter ce transfert pour un prix ridiculement bas.
  `,
}

/** @enum */
export enum OfferRejectedEmailRelocate {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  C'est un échec pour le transfert de chez **{{it.transfer.from.name}}**, la personne ne veut pas changer de région.
  {{#else}}
  La personne a rejeté ton offre, elle n'a pas envie de changer de région.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedEmailSquadDepth {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  Nous ne pouvons pas transférer cette personne, car c'est un élément indispensable à notre équipe.
  `,
}

/** @enum */
export enum OfferRejectedEmailUnlisted {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  Nous ne pouvons accepter ton offre, car la personne n'est pas disponible pour un transfert.
  `,
}

/** @enum */
export enum OfferRejectedEmailWages {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  C'est un échec pour le transfert de chez **{{it.transfer.from.name}}**, aucun accord n'a pu être parvenu concernant le salaire proposé.
  {{#else}}
  La personne a rejeté ton offre, car le salaire proposé était trop bas.

  Il faudra proposer un salaire plus décent, si on peut se le permettre.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Offre de transfert : {{it.transfer.target.name}}',
  CONTENT = `Offre rejetée pour {{it.transfer.from.name}}.`,
}

/** @enum */
export enum SponsorshipAccepted {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  Excellente nouvelle ! **{{it.sponsorship.sponsor.name}}** a accepté notre offre, et ils nous sponsorisent à partir d'aujourd'hui !
  `,
}

/** @enum */
export enum SponsorshipBonuses {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  Félicitations pour ton travail exemplaire cette saison ! **{{it.sponsorship.sponsor.name}}** est très content de notre performance, il nous a récompensé avec quelques bonus :

  {{@each(it.bonuses) => bonus}}
  - {{bonus}}
  {{/each}}
  `,
}

/** @enum */
export enum SponsorshipGeneric {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = '',
}

/** @enum */
export enum SponsorshipInvite {
  SUBJECT = 'Invitation au tournoi de {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}} !

  On a reçu une invitation pour participer au **{{it.idiomaticTier}}**, offerte par notre sponsor **{{it.sponsorship.sponsor.name}}**.

  C'est toi qui choisis — dis-moi si tu penses qu'on devrait accepter.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/invite/accept" data-payload="{{it.sponsorship.id}}">Accepter l'invitation</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/invite/reject" data-payload="{{it.sponsorship.id}}">Refuser l'invitation</button>
  `,
}

/** @enum */
export enum SponsorshipInviteAcceptedUser {
  SUBJECT = 'Invitation au tournoi de {{it.sponsorship.sponsor.name}}',
  CONTENT = "Tu as accepté l'invitation de {{it.sponsorship.sponsor.name}}.",
}

/** @enum */
export enum SponsorshipInviteRejectedUser {
  SUBJECT = 'Invitation au tournoi de {{it.sponsorship.sponsor.name}}',
  CONTENT = "Tu as refusé l'invitation de {{it.sponsorship.sponsor.name}}.",
}

/** @enum */
export enum SponsorshipRejectedTier {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  On a été un peu audacieux, mais il fallait s'y attendre. **{{it.sponsorship.sponsor.name}}** a décliné notre offre de sponsoring, car nous ne sommes pas dans la division minimum nécessaire. On aura essayé quand même !
  `,
}

/** @enum */
export enum SponsorshipRenew {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  Your contract has expired with **{{it.sponsorship.sponsor.name}}**, however, they are keen on continuing their partnership with us.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/renew/accept" data-payload="{{it.sponsorship.id}}">Accept</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/renew/reject" data-payload="{{it.sponsorship.id}}">Reject</button>
  `,
}

/** @enum */
export enum SponsorhipRenewAcceptedUser {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `Accepted {{it.sponsorship.sponsor.name}}'s offer.`,
}

/** @enum */
export enum SponsorhipRenewRejectedUser {
  SUBJECT = 'Sponsorship Offer to {{it.sponsorship.sponsor.name}}',
  CONTENT = `Rejected {{it.sponsorship.sponsor.name}}'s offer.`,
}

/** @enum */
export enum SponsorshipTerminated {
  SUBJECT = 'Sponsoring : {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Salut {{it.profile.player.name}}.

  C'est un coup dur pour l'équipe, nous venons de perdre notre sponsor **{{it.sponsorship.sponsor.name}}** car nous n'avons pas respecté les objectifs requis, comme stipulé dans le contrat.

  Voici ce qui a provoqué la rupture du contrat :

  {{@each(it.requirements) => requirement}}
  - {{requirement}}
  {{/each}}
  `,
}

/** @enum */
export enum WelcomeEmail {
  SUBJECT = 'Bienvenue !',
  CONTENT = `
  Salut {{it.profile.player.name}} !

  Je suis {{it.persona.name}}, ton assistant manager. Je t'envoie ce mail pour te saluer et me présenter en bonne et due forme.

  Notre premier match est bientôt là, je me permets de t'expliquer quelques petits trucs.

  - Une fois que tu es dans la partie, tu peux écrire dans le chat \`.ready\` pour le match démarre immédiatement.
  - Tu peux également attendre la fin du warm-up si tu le souhaites, si tu veux t'entraîner un peu avant.
  - Après la fin du match, tu peux fermer le jeu, le score sera automatiquement sauvegardé.

  GL HF !
  `,
}
