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
  SUBJECT = 'Congratulations {{it.profile.team.name}}!',
  CONTENT = `
  Hi, {{it.profile.player.name}}!

  Congrats on winning the **{{it.competition}}**!

  Keep up the good work!
  `,
}

/** @enum */
export enum AwardTypePromotion {
  SUBJECT = 'Moving on up!',
  CONTENT = `
  Hi, {{it.profile.player.name}}!

  Good job on getting promoted from **{{it.competition}}**!

  Next season we'll be playing in a tougher division so let's do our best!
  `,
}

/** @enum */
export enum AwardTypeQualify {
  SUBJECT = 'Qualified!',
  CONTENT = `
  Hey, {{it.profile.player.name}}!

  Good job on qualifying from the **{{it.competition}}** and moving on to the next round!

  It's only going to get tougher from here.
  `,
}

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  The player, **{{it.transfer.target.name}}**, has been sold to {{it.transfer.from.name}}.
  {{#else}}
  I'm pleased to inform you that **{{it.transfer.target.name}}** has accepted our offer.

  Let's use him in our squad!
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  That offer works for us. It is now up to **{{it.transfer.target.name}}** on whether they choose to accept your proposed wages.
  `,
}

/** @enum */
export enum OfferAcceptedUser {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `Accepted {{it.transfer.from.name}}'s offer.`,
}

/** @enum */
export enum OfferGeneric {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = '',
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hello, {{it.profile.player.name}}.

  **{{it.transfer.from.name}}** are interested in a transfer for **{{it.transfer.target.name}}**.

  The details are below:

  - Transfer fee: {{it.transfer.offers[0].cost | currency}}

  - Wages: {{it.transfer.offers[0].wages | currency}}

  ---

  <button className="btn btn-primary" data-ipc-route="/transfer/accept" data-payload="{{it.transfer.id}}">Accept Offer</button>
  <button className="btn btn-ghost" data-ipc-route="/transfer/reject" data-payload="{{it.transfer.id}}">Reject Offer</button>
  `,
}

/** @enum */
export enum OfferRejectedEmailCost {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  We are not willing to sell the player for such a low cost.
  `,
}

/** @enum */
export enum OfferRejectedEmailRelocate {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Talks between the player and **{{it.transfer.from.name}}** have broken down because they are not willing to move regions.
  {{#else}}
  The player has rejected your offer because they are not willing to move to our region.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedEmailSquadDepth {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi {{it.profile.player.name}},

  We are not open to selling this player as they are crucial to our squad.
  `,
}

/** @enum */
export enum OfferRejectedEmailUnlisted {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  We are not willing to sell the player as he is not up for transfer.
  `,
}

/** @enum */
export enum OfferRejectedEmailWages {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  {{@if(it.transfer.to && it.transfer.to.id == it.profile.team.id)}}
  Talks between the player and **{{it.transfer.from.name}}** have broken down because they could not reach an agreement on wages.
  {{#else}}
  The player has rejected your offer because they say the wages offered are too low.

  We might have to spend a little more for this player, if we can afford it.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `Rejected {{it.transfer.from.name}}'s offer.`,
}

/** @enum */
export enum SponsorshipAccepted {
  SUBJECT = 'Sponsorship Offer for {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  Great news! **{{it.sponsorship.sponsor.name}}** has accepted our sponsorship application and will be supporting us moving forward.
  `,
}

/** @enum */
export enum SponsorshipBonuses {
  SUBJECT = 'Sponsorship Offer for {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey, {{it.profile.player.name}}.

  Great job this season! **{{it.sponsorship.sponsor.name}}** is pleased with your team's performance and has awarded the following bonuses:

  {{@each(it.bonuses) => bonus}}
  - {{bonus}}
  {{/each}}
  `,
}

/** @enum */
export enum SponsorshipGeneric {
  SUBJECT = 'Sponsorship Offer for {{it.sponsorship.sponsor.name}}',
  CONTENT = '',
}

/** @enum */
export enum SponsorshipInvite {
  SUBJECT = 'Tournament Invite for {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}}!

  We've received an invitation to compete in **{{it.idiomaticTier}}**, courtesy of our sponsor **{{it.sponsorship.sponsor.name}}**.

  It's your call—let me know if you think we should accept.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/invite/accept" data-payload="{{it.sponsorship.id}}">Accept Invite</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/invite/reject" data-payload="{{it.sponsorship.id}}">Reject Invite</button>
  `,
}

/** @enum */
export enum SponsorshipInviteAcceptedUser {
  SUBJECT = 'Tournament Invite for {{it.sponsorship.sponsor.name}}',
  CONTENT = "Accepted {{it.sponsorship.sponsor.name}}'s invitation.",
}

/** @enum */
export enum SponsorshipInviteRejectedUser {
  SUBJECT = 'Tournament Invite for {{it.sponsorship.sponsor.name}}',
  CONTENT = "Rejected {{it.sponsorship.sponsor.name}}'s invitation.",
}

/** @enum */
export enum SponsorshipRejectedTier {
  SUBJECT = 'Sponsorship Offer to {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hey {{it.profile.player.name}},

  Unfortunately, **{{it.sponsorship.sponsor.name}}** has rejected our sponsorship offer as we do not meet their minimum league division requirement.
  `,
}

/** @enum */
export enum SponsorshipRenew {
  SUBJECT = 'Sponsorship Offer to {{it.sponsorship.sponsor.name}}',
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
  SUBJECT = 'Sponsorship Offer to {{it.sponsorship.sponsor.name}}',
  CONTENT = `Accepted {{it.sponsorship.sponsor.name}}'s offer.`,
}

/** @enum */
export enum SponsorhipRenewRejectedUser {
  SUBJECT = 'Sponsorship Offer to {{it.sponsorship.sponsor.name}}',
  CONTENT = `Rejected {{it.sponsorship.sponsor.name}}'s offer.`,
}

/** @enum */
export enum SponsorshipTerminated {
  SUBJECT = 'Sponsorship Offer for {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  We've hit a bump in the road—**{{it.sponsorship.sponsor.name}}** has decided to terminate our sponsorship due to unmet contract requirements.

  Here's what we fell short on:

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

  My name is {{it.persona.name}} and I am your assistant manager. I just wanted to say hello and introduce myself.

  Our first match is coming up so I wanted to let you know about a few things.

  - Once you're in-game you can type \`.ready\` in chat and the match will start immediately.
  - You can also wait for the warm-up timer to finish.
  - After the match is over, you can close out your game as the score will be automatically recorded.

  GL HF!
  `,
}
