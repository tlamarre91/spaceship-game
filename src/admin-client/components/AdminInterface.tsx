import React from "react";
import Layout from "./Layout";
import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import { GameClient } from "~client/GameClient";

export interface AdminInterfaceProps {
}

export const AdminInterface: React.FC<AdminInterfaceProps> = (props) => {
  const [clients, setClients] = React.useState<GameClient[]>([]);
  React.useEffect(() => {
    const clients: GameClient[] = [];
    for (let i = 0; i < 512; i += 1) {
      const client = new GameClient()
      clients.push(client);
      client.start();
    }
    setClients(clients);
  }, []);
  return (
    <Layout>
      {clients.map((client) => (
        <div key={client.clientId}>
          {client.clientId}
        </div>
      ))}
    </Layout>
  );
}

export default AdminInterface;
