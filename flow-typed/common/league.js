import type { Competitor } from 'common/league'

declare type Conference = {
  id: string,
  competitors: Array<Competitor>,
  groupObj: Object
}