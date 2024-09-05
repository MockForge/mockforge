import express, { Request, Response } from "express";
import getPort from "get-port";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { RPCRequestBody, RPCResponse } from "./../common/rpc.js";
import { MockForgeStateService } from "./service.js";
import { MockForgeEvent } from "../common/event.js";

export interface CreateMockForgeServerOption {
  baseDir: string;
  port?: number;
}

interface Client {
  id: string;
  ws: WebSocket;
}

export async function createMockForgeServer(
  option: CreateMockForgeServerOption
): Promise<number> {
  const serverPort = await getPort({ port: option.port || 50830 });

  return new Promise((resolve, reject) => {
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });
    app.use(express.json());

    const mockForgeStateService = new MockForgeStateService(option.baseDir);
    const clients: Client[] = [];
    // 添加一个方法来发送事件给所有客户端
    function broadcastEvent(event: MockForgeEvent) {
      clients.forEach((client) => {
        client.ws.send(JSON.stringify(event));
      });
    }

    app.post("/rpc", async (req: Request, res: Response) => {
      const requestBody = req.body as RPCRequestBody;
      const { method, args, clientId } = requestBody;

      let response: RPCResponse;

      try {
        const serviceMethod = mockForgeStateService[
          method as keyof MockForgeStateService
        ] as Function;
        if (typeof serviceMethod !== "function") {
          throw new Error(`Unknown method: ${method}`);
        }
        const result = await serviceMethod.apply(mockForgeStateService, args);
        response = {
          success: true,
          data: result,
          clientId,
        };
      } catch (error) {
        response = {
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
          clientId,
        };
      }

      try {
        switch (method as keyof MockForgeStateService) {
          case "addMockAPI":
          case "deleteHttpMockAPI":
          case "deleteHttpMockResponse":
          case "updateHttpMockAPI":
          case "addHttpMockResponse": {
            broadcastEvent({
              type: "http-mock-api-change",
              clientId,
            });
            break;
          }
          case "toggleHttpApiResponse": {
            broadcastEvent({
              type: "http-mock-api-change",
              clientId,
            });
            break;
          }
        }
      } catch (error) {}
      res.json(response);
    });

    wss.on("connection", (ws: WebSocket, req: Request) => {
      const clientId = req.headers["mock-forge-client-id"] as string;
      if (clientId) {
        const client: Client = { id: clientId, ws };
        clients.push(client);
        ws.on("close", () => {
          const index = clients.findIndex((c) => c.id === clientId);
          if (index !== -1) {
            clients.splice(index, 1);
            console.log(`Client ${clientId} disconnected`);
          }
        });
      } else {
        ws.close();
      }
    });
    server.listen(serverPort, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        resolve(address.port);
      } else {
        reject(new Error("Failed to get server address"));
      }
    });
    server.on("error", (error) => {
      reject(error);
    });
  });
}
