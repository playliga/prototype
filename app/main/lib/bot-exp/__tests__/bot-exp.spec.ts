import Tiers from 'shared/tiers';
import BotExp from '../bot-exp';


describe( 'bot experience points', () => {
  it( 'generates xp when training', () => {
    const stats = {
      skill: 1,
      aggression: 20,
      reactionTime: 0.5,
      attackDelay: 1.5
    };

    const xp = new BotExp( stats );
    xp.train();
    expect( stats ).not.toEqual( xp.stats );
  });

  it( 'gets the tier and bot template ids for the provided stats', () => {
    Tiers.forEach( ( tier, tierdx ) => {
      tier.templates.forEach( ( tpl, tpltdx ) => {
        const stats = tpl.stats;
        const xp = new BotExp( stats );
        expect( xp.getTierId() ).toEqual([ tierdx, tpltdx ]);
      });
    });
  });
});
