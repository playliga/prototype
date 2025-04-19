# v3.0.0-beta.29

## CS2 Support Added

<video muted loop playsInline autoplay>
  <source src="resources://markdown/whats-new/cs2.mp4#t=0.1" type="video/mp4" />
</video>

The long-awaited update is finally here!

After months of waiting for CS2 to stabilize and previously removed features to be re-implemented, you can play your matches in CS2.

However, please note that this feature is still _very experimental_. Many functionalities available in other versions of Counter-Strike are not yet fully supported.

One of the most glaring issues is the state of bot mechanics in CS2. The current implementation falls short in terms of reaching feature-parity with CS:GO, with several limitations:

- Bots often struggle with navigation; resulting in them getting stuck or failing to perform critical tasks.
- Waypoints and pathfinding behavior remain inconsistent across various maps.
- Bomb-related actions such as planting and defusing may fail in certain scenarios.

### Other Known Issues

- Ready-up messages are not printed out by the server.
- Users are not automatically added to the correct team upon joining the server.
- The postgame modal will render all match events under the first half.

## Improved Bot Mechanics for CS:GO

Big shoutout to the creator of the [CSGO Better Bots](https://github.com/manicogaming/CSGOBetterBots) SourceMod plugin.

Thanks to their work, bots in the app now have enhanced mechanics, including the ability to execute nade line-ups on specific maps. Their overall use of equipment has also seen a noticeable improvement, making matches feel more dynamic and realistic.

Check out this [demo video](https://imgur.com/a/liga-esports-manager-cs-go-better-bots-demo-dvoJIgY) to see a bot pulling off a smoke line-up on `de_dust2`.

## Mod Manager

![](resources://markdown/whats-new/mod-manager.png)

You can now create custom database entries and team logos, then publish them for others to download and enjoy.

This opens the door for the community to craft mods—like adding real pro-team names and logos—and makes it effortless for users to discover, download, and install them directly from within the app.

Interested in creating your own mod? Check out the [modding docs](https://github.com/playliga/prototype/wiki/Modding) for all the details on customizing databases and team logos.

_Please note the above docs are still a work-in-progress!_

## League Playoffs

![](resources://markdown/whats-new/playoffs.png)

League divisions now have a definitive way to crown champions.

Playoffs have been introduced for all divisions, from Open to Premier. The top three teams from these playoffs earn a promotion to the next division, while the 4th-placed team stays to fight another season in their current division.

## Transfer Market

![](resources://markdown/whats-new/offer.png)

The Transfer Market is back and better than ever. Now, you can actively shape your roster by sending offers to other teams, while also receiving incoming offers for your players.

Here's how it works:

- **Make an Offer:** Submit an offer to a team. If they find it reasonable, they'll approve the deal.
- **Sweeten the Deal:** If your offer is rejected, don't give up! You can offer above asking price and they will be more likely to change their mind.
- **Player Approval:** Even after the team accepts, the deal isn't final. The Player must agree to the proposed wages and destination team.
- **Pro Tip:** Signing players from other regions can be challenging—they might hesitate to relocate.

## Discord Server

![](resources://markdown/whats-new/discord.png)

There is now a discord server!

The server aims to keep everyone informed about the latest developments and serve as a hub for streamlined feedback. You'll be able to share suggestions, report bugs, and stay up-to-date with the project, all in one place.

- [discord.gg/ZaEwHfDD5N](https://discord.gg/ZaEwHfDD5N)
