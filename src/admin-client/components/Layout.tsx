import React from "react";

export interface LayoutProps {
}

export const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className="admin-layout">
      { props.children }
    </div>
  );
}

export default Layout;

