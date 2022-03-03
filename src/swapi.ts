import { PLANETS } from "./__fixtures__/PLANETS";

export type PlanetsResponse = typeof PLANETS
export type Planet = PlanetsResponse['results'][number]