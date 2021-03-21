import "setimmediate";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { log } from "~shared/log";
import { store } from "./redux/store";
import AdminInterface from "./components/AdminInterface";

function main() {
  log.info("heyo");
  console.log("heyo");
  const component = (
    <React.StrictMode>
      <Provider store={store}>
        <AdminInterface />
      </Provider>
    </React.StrictMode>
  );
  ReactDOM.render(component, document.getElementById("content"));
}

document.addEventListener("DOMContentLoaded", main);
