import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectValue,
  appendRandom
} from "../redux/reducers";
import Layout from "./Layout";
import { log } from "~shared/log";
import { idtrim } from "~shared/util";
import * as net from "~shared/net";
import { GameClient } from "~client/GameClient";

export interface ClientState {
  clientId: string;
}

export interface AdminInterfaceProps {
}

export const AdminInterface: React.FC<AdminInterfaceProps> = (props) => {
  const [clients, setClients] = React.useState<GameClient[]>([]);
  const testValue = useSelector(selectValue);
  const dispatch = useDispatch();
  //React.useEffect(() => {
  //  const clients: GameClient[] = [];
  //  for (let i = 0; i < 16; i += 1) {
  //    const client = new GameClient()
  //    clients.push(client);
  //    client.start();
  //    client.addEventHandler(net.TurnEnd.event, (msg: net.TurnEnd) => {
  //      console.log(idtrim(client.clientId), msg.turnEvents);
  //    });
  //  }
  //  setClients(clients);
  //}, []);
  return (
    <Layout>
      {clients.map((client) => (
        <div key={client.clientId}>
          {client.clientId}
        </div>
      ))}
      <button onClick={() => {
        dispatch(appendRandom())
      }}>
        do the thing
      </button>
      { testValue }
    </Layout>
  );
}

export default AdminInterface;
