const INTRO = `
Hi, {{it.player.alias}}.

My name is {{it.persona.fname}} and I am your assistant manager. I just wanted to say hello and inform you that we should start looking for your starting squad.

Without a squad we won't be able to compete in any competitions.
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
  TEAM_REJECT_REASON_NOTFORSALE,
  TEAM_REJECT_REASON_FEE,
};
