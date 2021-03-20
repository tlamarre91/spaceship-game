import React from "react";
import Layout from "./Layout";
import { GameClient } from "~client/GameClient";

export interface AdminInterfaceProps {
}

export const AdminInterface: React.FC<AdminInterfaceProps> = (props) => {
  const clients: GameClient[] = [1,2,3,4,5,6].map(() => new GameClient());
  clients.forEach((client) => client.start());
  return (
    <Layout>
      placeholder!
    </Layout>
  );
}

export default AdminInterface;
