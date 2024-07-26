import React from "react";
import Translation from "./Translation/Translation";

export default function RootProvider({ children }) {
  return (
    <>
      <Translation>{children}</Translation>
    </>
  );
}
