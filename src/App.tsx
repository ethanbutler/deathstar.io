import React from "react";
import { useMutation, useQuery } from "react-query";
import { Planet, PlanetsResponse } from "swapi";
import "./App.css";

function App() {
  const [lastDestroyedPlanet, setLastDestroyedPlanet] = React.useState("");

  /* List of planets in the Star Wars universe. */
  const planets = useQuery("planets", async () => {
    const res = await fetch("https://swapi.dev/api/planets");
    const data = (await res.json()) as PlanetsResponse;
    return data.results;
  });

  /** Blow up a planet. */
  const destroy = useMutation(async (planet: Planet) => {
    if (planet.name === "Alderaan") {
      throw new Error("Oh no! The Rebel alliance blew you up.");
    }

    await new Promise((r) => setTimeout(r, 500));
    setLastDestroyedPlanet(planet.name);
  });

  // Initial loading state
  if (!planets.data) {
    return <div>Loading</div>;
  }

  // Success screen
  if (lastDestroyedPlanet) {
    return (
      <main>
        <h2>You just destroyed {lastDestroyedPlanet}!</h2>
        <button onClick={() => setLastDestroyedPlanet("")}>Back</button>
      </main>
    );
  }

  if (destroy.isError) {
    return (
      <main>
        <h2>{(destroy.error as Error).message}</h2>
      </main>
    );
  }

  return (
    <main>
      <h1>Deathstar.io</h1>

      <section>
        {planets.data.map((planet) => (
          <article key={planet.name}>
            <h2>{planet.name}</h2>
            <button
              onClick={async () => {
                try {
                  await destroy.mutateAsync(planet);
                } catch (err) {
                  //
                }
              }}
            >
              Destroy {planet.name}
            </button>
          </article>
        ))}
      </section>

      {destroy.isLoading && <div>Destroying a planet</div>}
    </main>
  );
}

export default App;
