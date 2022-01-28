const ENDSEASON_PROMOTION_AUTO = `
Hey, {{it.player.alias}}.

Congratulations on a successful season!

I'm looking forward to our next season in a higher division.
`;


const ENDSEASON_PROMOTION_PLAYOFFS = `
Hey, {{it.player.alias}}.

Congratulations on making it thru the promotional playoffs and earning us a spot in a higher division!
`;


const ENDSEASON_RELEGATION = `
Hey, {{it.player.alias}}.

That wasn't a good season for us. We'll be going down a division as a result, but I'm sure we'll come back next season stronger than ever!
`;


const INTRO = `
Hi, {{it.player.alias}}.

My name is {{it.persona.fname}} and I am your assistant manager. I just wanted to say hello and inform you that we should start looking for your starting squad.

Without a squad we won't be able to compete in any competitions.
`;


const INTRO_HOW_TO_PLAY = `
Hey, {{it.player.alias}}.

Our first match is coming up so I wanted to let you know about a few things.

- Once you're in-game you can type ".ready" in chat and the match will start immediately.
- You can also wait for the warm-up timer to finish.
- After the match is over, you can close out your game as the score will be automatically recorded.

GL HF!
`;


const OFFER_SENT = `
Hey, {{it.player.alias}}.

We've gotten a transfer offer from {{it.team.name}} for {{it.target.alias}}.
`;


const PLAYER_ACCEPT = `
Hi, {{it.player.alias}}.

{{@if(it.team)}}
The player has been sold to {{it.team.name}}.
{{#else}}
The player has accepted the offer. Let's use him in our squad!
{{/if}}
`;


const PLAYER_REJECT_REASON_REGION = `
Hi, {{it.player.alias}},

{{@if(it.team)}}
Talks between the player and {{it.team.name}} have broken down because they are not willing to move regions.
{{#else}}
The player has rejected your offer because they are not willing to move to our region.
{{/if}}
`;


const PLAYER_REJECT_REASON_TIER = `
Hi, {{it.player.alias}},

{{@if(it.team)}}
Talks between the player and {{it.team.name}} have broken down because their tier is too low.
{{#else}}
The player has rejected your offer because they say our team's skill level is too low.
{{/if}}
`;


const PLAYER_REJECT_REASON_WAGES = `
Hi, {{it.player.alias}},

{{@if(it.team)}}
Talks between the player and {{it.team.name}} have broken down because they could not reach an agreement on wages.
{{#else}}
The player has rejected your offer because they say the wages offered are too low.

We might have to spend a little more for this offer.
{{/if}}
`;


const TEAM_ACCEPT = `
Hi, {{it.player.alias}}.

That offer works for us. It is now up to the player on whether they choose to accept your proposed wages.
`;


const TEAM_REJECT_REASON_ADJUSTED_FEE = `
Hi, {{it.player.alias}}.

The fee you suggested is too high for us. We will not be pursuing further with this offer.
`;


const TEAM_REJECT_REASON_NOTFORSALE = `
Hi, {{it.player.alias}}.

Our player is not for sale, imbecil.
`;


const TEAM_REJECT_REASON_FEE = `
Hi, {{it.player.alias}}.

The offer is too low. You cheap idiot.
`;


const TEAM_REJECT_REASON_SQUAD_DEPTH = `
Hi, {{it.player.alias}}.

We are not open to selling this player as they are a crucial to our squad.
`;


const USER_PENDING_REASON_FEE_ADJUSTMENT = `
Hello,

I'm willing to sell this player for an adjusted fee.
`;


export default {
  ENDSEASON_PROMOTION_AUTO,
  ENDSEASON_PROMOTION_PLAYOFFS,
  ENDSEASON_RELEGATION,
  INTRO,
  INTRO_HOW_TO_PLAY,
  OFFER_SENT,
  PLAYER_ACCEPT,
  PLAYER_REJECT_REASON_REGION,
  PLAYER_REJECT_REASON_TIER,
  PLAYER_REJECT_REASON_WAGES,
  TEAM_ACCEPT,
  TEAM_REJECT_REASON_ADJUSTED_FEE,
  TEAM_REJECT_REASON_NOTFORSALE,
  TEAM_REJECT_REASON_FEE,
  TEAM_REJECT_REASON_SQUAD_DEPTH,
  USER_PENDING_REASON_FEE_ADJUSTMENT
};
