import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import cors from "cors";
import { typeDefs } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { GameManager } from "./services/gameManager.js";
import { PubSubManager } from "./services/pubSubManager.js";

const app = express();
const httpServer = createServer(app);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});

const serverCleanup = useServer(
  {
    schema,
    context: () => ({
      gameManager: GameManager.getInstance(),
      pubSub: PubSubManager.getInstance(),
    }),
  },
  wsServer,
);

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),

    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

app.use(
  "/graphql",
  cors<cors.CorsRequest>({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({
      gameManager: GameManager.getInstance(),
      pubSub: PubSubManager.getInstance(),
      userId: req.headers["user-id"] as string,
    }),
  }),
);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  console.log(
    `🔗 WebSocket subscriptions ready at ws://localhost:${PORT}/graphql`,
  );
});
