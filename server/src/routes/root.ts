import { FastifyPluginAsync } from "fastify";
import path from "node:path";
import fastifyStatic from "@fastify/static";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const distPath = path.resolve(process.cwd(), "..", "client", "dist");

  fastify.register(fastifyStatic, {
    root: distPath,
    prefix: "/",
  });

  fastify.setNotFoundHandler((request, reply) => {
    reply.sendFile("index.html");
  });
};

export default root;
