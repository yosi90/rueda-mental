import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Procesos separados: los tests cambian process.env.TZ para probar varias zonas horarias.
        pool: "forks",
    },
});
