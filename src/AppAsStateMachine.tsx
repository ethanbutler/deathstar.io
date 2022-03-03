import { Planet, PlanetsResponse } from "swapi";
import { useMachine } from "@xstate/react";
import { assign, createMachine } from "xstate";
import "./App.css";

type DeathStarContext = {
  planets: Planet[],
  planetToDestroy: Planet['name']
}

type DeathStarEvent = {
  type: 'BACK'
} | {
  type: 'DESTROY',
  name: string
}

const deathStarMachine = createMachine<DeathStarContext, DeathStarEvent>({
  id: "death-star",
  initial: "loading",
  context: {
    planets: [] as Planet[],
    planetToDestroy: "",
  },
  states: {
    loading: {
      invoke: {
        src: "fetchPlanets",
        onDone: {
          target: "planets",
          actions: assign({
            planets: (_, event) => event.data,
          })
        },
        onError: "planetFailure",
      },
    },
    planetFailure: {
      type: "final",
    },
    planets: {
      on: {
        DESTROY: {
          target: "destroying",
          actions: assign({
            planetToDestroy: (_, event) => event.name,
          })
        },
      },
    },
    destroying: {
      invoke: {
        src: "destroyPlanet",
        onDone: {
          target: "destroyed",
          actions: assign({
            planets: (context, event) => {
              return context.planets.filter((p) => p.name !== event.data)
            }
          })
        },
        onError: "failure",
      },
    },
    destroyed: {
      on: {
        BACK: "planets",
      },
    },
    failure: {
      type: "final",
    },
  },
});

export default function App() {
  const [state, send] = useMachine(deathStarMachine, {
    services: {
      fetchPlanets: async () => {
        const res = await fetch("https://swapi.dev/api/planets");
        const data = (await res.json()) as PlanetsResponse;
        return data.results;
      },
      destroyPlanet: async (context) => {
        if (context.planetToDestroy === "Alderaan") {
          throw new Error("Oh no! The Rebel alliance blew you up.");
        }

        await new Promise((r) => setTimeout(r, 500));
        return context.planetToDestroy
      }
    }
  });

  if (state.value === "loading") {
    return <main>Loading</main>;
  }

  if (state.value === "planetFailure") {
    return <main>Could not fetch planets.</main>;
  }

  if (state.value === "failure") {
    return <main>Oh no! The Rebel alliance blew you up.</main>;
  }

  if (state.value === "destroyed") {
    return (
      <main>
        <h2>You just destroyed {state.context.planetToDestroy}!</h2>
        <button onClick={() => send('BACK')}>Back</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Deathstar.io</h1>

      <section>
        {state.context.planets.map((planet) => (
          <article key={planet.name}>
            <h2>{planet.name}</h2>
            <button
              onClick={() => send('DESTROY', planet)}
            >
              Destroy {planet.name}
            </button>
          </article>
        ))}
      </section>

      {state.value === 'destroying' && <div>Destroying a planet</div>}
    </main>
  )
}
