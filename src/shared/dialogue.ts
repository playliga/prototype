/**
 * Dialogue between the application and the user.
 *
 * @module
 */

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  The player, {{it.transfer.target.name}}, has been sold to {{it.transfer.from.name}}.
  {{#else}}
  I'm pleased to inform you that {{it.transfer.target.name}} has accepted our offer.

  Let's use him in our squad!
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hi, {{it.profile.player.name}}.

  That offer works for us. It is now up to {{it.transfer.target.name}} on whether they choose to accept your proposed wages.
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
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `
  Hello, {{it.profile.player.name}}.

  {{it.transfer.from.name}} are interested in a transfer for {{it.transfer.target.name}}.

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

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  Talks between the player and {{it.transfer.from.name}} have broken down because they are not willing to move regions.
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

  We are not open to selling this player as they are a crucial to our squad.
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

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  Talks between the player and {{it.transfer.from.name}} have broken down because they could not reach an agreement on wages.
  {{#else}}
  The player has rejected your offer because they say the wages offered are too low.

  We might have to spend a little more for this offer.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Transfer Offer for {{it.transfer.target.name}}',
  CONTENT = `Rejected {{it.transfer.from.name}}'s offer.`,
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
