import { fireEvent, render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { PLANETS } from "__fixtures__/PLANETS";
import App from "App";
import { QueryClient, QueryClientProvider } from "react-query";
import { createMachine } from "xstate";
import { createModel } from "@xstate/test";

// #region Test setup
const server = setupServer();
const queryClient = new QueryClient();

const renderWithQueryClient = (children: any) =>
  render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

beforeEach(() => {
  // Response with mock planets
  server.use(
    rest.get(/.*planets$/, (_, res, ctx) => {
      return res(ctx.json(PLANETS));
    })
  );

  console.error = () => null
});

afterEach(() => {
  server.resetHandlers();
});
// #endregion

// #region "Traditional" testing
describe("App", () => {
  it("displays a loader before showing any planets", async () => {
    renderWithQueryClient(<App />);
    await screen.findByText("Loading");
    await screen.findByText("Deathstar.io");
  });

  it("allows a planet to be destroyed, then navigated back", async () => {
    renderWithQueryClient(<App />);
    const btn = await screen.findByText("Destroy Tatooine");
    fireEvent.click(btn);
    await screen.findByText("Destroying a planet");
    await screen.findByText("You just destroyed Tatooine!");
    const backBtn = screen.getByText("Back");
    fireEvent.click(backBtn);
    screen.getByText("Deathstar.io");
  });

  it("fails when you try to blow up Alderaan", async () => {
    renderWithQueryClient(<App />);
    const btn = await screen.findByText("Destroy Alderaan");
    fireEvent.click(btn)
    await screen.findByText(/Oh no/);
  });
});
// #endregion "Traditional" testing

// #region Model-based testing

// Visualizer: https://stately.ai/viz/a1eedf8a-fea2-4c2a-bba1-e013680ffd14
// Editor: https://stately.ai/registry/editor/f323fc93-87fd-4f79-9924-9690856b6a5c

const deathStarMachine = createMachine({
  id: 'death-star',
  initial: 'planets',
  states: {
    planets: {
      on: {
        DESTROY: 'destroyed',
        FAIL_TO_DESTROY: 'failure',
      },
      meta: {
        test: async () => {
          await screen.findByText('Destroy Tatooine')
        }
      }
    },
    destroyed: {
      on: {
        BACK: 'planets'
      },
      meta: {
        test: async () => {
          await screen.findByText('Back')
        }
      }
    },
    failure: {
      type: 'final',
      meta: {
        test: async () => {
          await screen.findByText(/Oh no/)
        }
      }
    }
  }
})

const deathStarModel = createModel(deathStarMachine).withEvents({
  DESTROY: {
    exec: async () => {
      const btn = await screen.findByText('Destroy Tatooine')
      fireEvent.click(btn)
    }
  },
  FAIL_TO_DESTROY: {
    exec: async () => {
      const btn = await screen.findByText('Destroy Alderaan')
      fireEvent.click(btn)
    }
  },
  BACK: {
    exec: async () => {
      const btn = await screen.findByText('Back')
      fireEvent.click(btn)
    }
  }
})

describe('App', () => {
  const testPlans = deathStarModel.getSimplePathPlans()

  testPlans.forEach(plan => {
    describe(plan.description, () => {
      plan.paths.forEach(path => {
        it(path.description, async () => {
          renderWithQueryClient(<App/>)
          await path.test(screen)
        })
      })
    })
  })

  it('should have full coverage', () => {
    return deathStarModel.testCoverage()
  })
})
// #endregion Model-based testing
