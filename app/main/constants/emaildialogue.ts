const INTRO = `
Hi, {{it.player.alias}}.

My name is {{it.persona.fname}} and I am your assistant manager. I just wanted to say hello and inform you that we should start looking for your starting squad.

Without a squad we won't be able to compete in any competitions.
`;


const PLAYER_ACCEPT = `
Hi, {{it.player.alias}}.

The player has accepted the offer. Let's use him in our squad!
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


const PRESEASON_AUTOADD_COMP = `
Hi, {{it.player.alias}}.

I've signed us up for the *{{it.compname}}: {{it.compregion}}* competition.

Since the season was about to start and we had not joined any competitions yet.
`;


const PRESEASON_AUTOADD_SQUAD = `
Hi, {{it.player.alias}}.

I've signed some players on a free transfer since the season is about to start and we still had not found any players for our squad:

{{@each(it.players) => player}}
- {{player.alias}}\n
{{/each}}
`;


const PRESEASON_COMP_DEADLINE = `
Hi, {{it.player.alias}}.

Our squad is ready to go but I noticed we haven't joined any competitions.

The season is about to start so we should get on that!
`;


const PRESEASON_SQUAD_DEADLINE = `
Hi, {{it.player.alias}}.

We don't have enough squad members to join any competitions.

There are some free agents in the transfer market we can send offers to.
`;


const PRESEASON_SQUAD_COMPLETE = `
  Hey, {{it.player.alias}}.

  I see we've gotten our squad in order. Now we can join competitions!

  Head on over to the competitions screen and look at what we can join.
`;


const TEAM_ACCEPT = `
Hi, {{it.player.alias}}.

That offer works for us. It is now up to the player on whether they choose to accept your proposed wages.
`;


const TEAM_REJECT_REASON_NOTFORSALE = `
Hi, {{it.player.alias}}.

Our player is not for sale, imbecil.
`;


const TEAM_REJECT_REASON_FEE = `
Hi, {{it.player.alias}}.

The offer is too low. You cheap idiot.
`;


export default {
  INTRO,
  PLAYER_ACCEPT,
  PLAYER_REJECT_REASON_TIER,
  PLAYER_REJECT_REASON_WAGES,
  PRESEASON_AUTOADD_COMP,
  PRESEASON_AUTOADD_SQUAD,
  PRESEASON_COMP_DEADLINE,
  PRESEASON_SQUAD_COMPLETE,
  PRESEASON_SQUAD_DEADLINE,
  TEAM_ACCEPT,
  TEAM_REJECT_REASON_NOTFORSALE,
  TEAM_REJECT_REASON_FEE,
};
