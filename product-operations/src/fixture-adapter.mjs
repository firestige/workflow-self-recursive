export function createFixtureAdapter(fixture = {}) {
  const recordedEffects = [];
  const interrupted = new Set();

  return Object.freeze({
    async preflight(component) {
      const message = fixture.preflightFailures?.[component.id];
      return message
        ? { status: "blocked", code: "PREFLIGHT_FAILED", message }
        : { status: "succeeded", data: { source: "fixture", component: component.id } };
    },

    async apply(command, component) {
      if (fixture.interruptOnceAt === component.id && !interrupted.has(component.id)) {
        interrupted.add(component.id);
        return {
          status: "blocked",
          code: "FIXTURE_INTERRUPTED",
          message: `fixture interrupted before ${command}:${component.id}`,
        };
      }
      recordedEffects.push(`${command}:${component.id}`);
      return { status: "succeeded", data: { source: "fixture" } };
    },

    async abort(command, component) {
      recordedEffects.push(`abort:${command}:${component.id}`);
      return { status: "succeeded", data: { source: "fixture" } };
    },

    async inspect(command, component) {
      return {
        status: "succeeded",
        data: { source: "fixture", command, component: component.id },
      };
    },

    effects() {
      return [...recordedEffects];
    },
  });
}
