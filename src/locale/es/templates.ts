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
  SUBJECT = '¡Felicidades {{it.profile.team.name}}!',
  CONTENT = `
  ¡Hola, {{it.profile.player.name}}!

  ¡Felicidades por ganar **{{it.competition}}**!

  ¡Sigue con el buen trabajo!
  `,
}

/** @enum */
export enum AwardTypePromotion {
  SUBJECT = '¡Subiendo de nivel!',
  CONTENT = `
  ¡Hola, {{it.profile.player.name}}!

  ¡Buen trabajo ascendiendo desde **{{it.competition}}**!

  La próxima temporada jugaremos en una división más difícil, ¡así que demos lo mejor de nosotros!
  `,
}

/** @enum */
export enum AwardTypeQualify {
  SUBJECT = '¡Clasificado!',
  CONTENT = `
  ¡Hola, {{it.profile.player.name}}!

  Buen trabajo clasificando desde **{{it.competition}}** y avanzando a la siguiente ronda.

  A partir de aquí, solo se pondrá más difícil.
  `,
}

/** @enum */
export enum OfferAcceptedPlayer {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  El jugador, **{{it.transfer.target.name}}**, ha sido vendido a {{it.transfer.from.name}}.
  {{#else}}
  Me complace informarte que **{{it.transfer.target.name}}** ha aceptado nuestra oferta.

  ¡Vamos a utilizarlo en nuestra escuadra!
  {{/if}}
  `,
}

/** @enum */
export enum OfferAcceptedTeam {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  Esa oferta nos parece bien. Ahora depende de **{{it.transfer.target.name}}** si acepta el salario propuesto.
  `,
}

/** @enum */
export enum OfferAcceptedUser {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `Oferta de {{it.transfer.from.name}} aceptada.`,
}

/** @enum */
export enum OfferGeneric {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = '',
}

/** @enum */
export enum OfferIncoming {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  **{{it.transfer.from.name}}** está interesado en una transferencia por **{{it.transfer.target.name}}**.

  Los detalles son los siguientes:

  - Tarifa de transferencia: {{it.transfer.offers[0].cost | currency}}

  - Salario: {{it.transfer.offers[0].wages | currency}}

  ---

  <button className="btn btn-primary" data-ipc-route="/transfer/accept" data-payload="{{it.transfer.id}}">Aceptar Oferta</button>
  <button className="btn btn-ghost" data-ipc-route="/transfer/reject" data-payload="{{it.transfer.id}}">Rechazar Oferta</button>
  `,
}

/** @enum */
export enum OfferRejectedEmailCost {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  No estamos dispuestos a vender al jugador por un precio tan bajo.
  `,
}

/** @enum */
export enum OfferRejectedEmailRelocate {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  Las negociaciones entre el jugador y **{{it.transfer.from.name}}** se han roto porque no están dispuestos a cambiar de región.
  {{#else}}
  El jugador ha rechazado tu oferta porque no está dispuesto a mudarse a nuestra región.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedEmailSquadDepth {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  No estamos dispuestos a vender a este jugador ya que es crucial para nuestra escuadra.
  `,
}

/** @enum */
export enum OfferRejectedEmailUnlisted {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  No estamos dispuestos a vender al jugador ya que no está disponible para transferencia.
  `,
}

/** @enum */
export enum OfferRejectedEmailWages {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  {{@if(it.transfer.to.id == it.profile.team.id)}}
  Las negociaciones entre el jugador y **{{it.transfer.from.name}}** se han roto porque no pudieron llegar a un acuerdo salarial.
  {{#else}}
  El jugador ha rechazado tu oferta porque considera que el salario ofrecido es demasiado bajo.

  Puede que tengamos que gastar un poco más si realmente queremos a este jugador.
  {{/if}}
  `,
}

/** @enum */
export enum OfferRejectedUser {
  SUBJECT = 'Oferta de Transferencia para {{it.transfer.target.name}}',
  CONTENT = `Oferta de {{it.transfer.from.name}} rechazada.`,
}

/** @enum */
export enum SponsorshipAccepted {
  SUBJECT = 'Oferta de Patrocinio de {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  ¡Buenas noticias! **{{it.sponsorship.sponsor.name}}** ha aceptado nuestra solicitud de patrocinio y nos apoyará en adelante.
  `,
}

/** @enum */
export enum SponsorshipBonuses {
  SUBJECT = 'Oferta de Patrocinio de {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  ¡Buen trabajo esta temporada! **{{it.sponsorship.sponsor.name}}** está satisfecho con el rendimiento del equipo y ha otorgado los siguientes bonos:

  {{@each(it.bonuses) => bonus}}
  - {{bonus}}
  {{/each}}
  `,
}

/** @enum */
export enum SponsorshipGeneric {
  SUBJECT = 'Oferta de Patrocinio de {{it.sponsorship.sponsor.name}}',
  CONTENT = '',
}

/** @enum */
export enum SponsorshipInvite {
  SUBJECT = 'Invitación al torneo de {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  ¡Hola {{it.profile.player.name}}!

  Hemos recibido una invitación para competir en **{{it.idiomaticTier}}**, cortesía de nuestro patrocinador **{{it.sponsorship.sponsor.name}}**.

  Tú decides — dime si crees que deberíamos aceptar.

  ---

  <button className="btn btn-primary" data-ipc-route="/sponsorship/invite/accept" data-payload="{{it.sponsorship.id}}">Aceptar invitación</button>
  <button className="btn btn-ghost" data-ipc-route="/sponsorship/invite/reject" data-payload="{{it.sponsorship.id}}">Rechazar invitación</button>
  `,
}

/** @enum */
export enum SponsorshipInviteAcceptedUser {
  SUBJECT = 'Invitación al torneo de {{it.sponsorship.sponsor.name}}',
  CONTENT = 'Has aceptado la invitación de {{it.sponsorship.sponsor.name}}.',
}

/** @enum */
export enum SponsorshipInviteRejectedUser {
  SUBJECT = 'Invitación al torneo de {{it.sponsorship.sponsor.name}}',
  CONTENT = 'Has rechazado la invitación de {{it.sponsorship.sponsor.name}}.',
}

/** @enum */
export enum SponsorshipRejectedTier {
  SUBJECT = 'Oferta de Patrocinio a {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hola {{it.profile.player.name}},

  Lamentablemente, **{{it.sponsorship.sponsor.name}}** ha rechazado nuestra oferta de patrocinio ya que no cumplimos con su requisito mínimo de división de liga.
  `,
}

/** @enum */
export enum SponsorshipTerminated {
  SUBJECT = 'Oferta de Patrocinio de {{it.sponsorship.sponsor.name}}',
  CONTENT = `
  Hola, {{it.profile.player.name}}.

  Hemos tenido un inconveniente—**{{it.sponsorship.sponsor.name}}** ha decidido terminar el patrocinio debido al incumplimiento de los requisitos del contrato.

  Esto es en lo que hemos fallado:

  {{@each(it.requirements) => requirement}}
  - {{requirement}}
  {{/each}}
  `,
}

/** @enum */
export enum WelcomeEmail {
  SUBJECT = '¡Hola!',
  CONTENT = `
  ¡Hola, {{it.profile.player.name}}!

  Me llamo {{it.persona.name}} y soy tu asistente. Solo quería saludarte y presentarme.

  Nuestro primer partido se acerca, así que quería contarte algunas cosas.

  - Una vez que estés en el juego, puedes escribir \`.ready\` en el chat y el partido comenzará de inmediato.
  - También puedes esperar a que termine el temporizador de calentamiento.
  - Después del partido, puedes cerrar el juego, ya que la puntuación se registrará automáticamente.

  ¡GL HF!
  `,
}
