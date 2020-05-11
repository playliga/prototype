import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Menu, Layout, Badge } from 'antd';
import { RouteConfig } from 'renderer/screens/main/types';
import './sidebar.scss';


/**
 * Collapsible navigation sidebar
 */


interface Props {
  onCollapse: ( collapsed: boolean ) => void;
  collapsed: boolean;
  logourl: string;
  config: RouteConfig[];
}


export default function Sidebar( props: Partial<RouteComponentProps> & Props ) {
  return (
    <Layout.Sider
      collapsible
      className="sidebar"
      collapsed={props.collapsed}
      onCollapse={props.onCollapse}
    >
      <section className="logocontainer">
        <img src={props.logourl} alt="La Liga" />
      </section>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[ props?.match?.path || '' ]}
      >
        {props.config.map( r => {
          if( r.subroutes ) {
            return (
              <Menu.SubMenu
                key={r.path}
                icon={React.createElement( r.icon )}
                title={r.title}
              >
                {r.subroutes.map( sr => (
                  <Menu.Item key={sr.path}>
                    <Link to={sr.key}>
                      {sr.title}
                    </Link>
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item
              key={r.path}
              icon={React.createElement( r.icon )}
            >
              <Link to={r.key}>
                {r.title}
                {(r.notifications && r.notifications > 0 )
                  ? !props.collapsed && <Badge count={r.notifications}/>
                  : null
                }
              </Link>
            </Menu.Item>
          );
        })}
      </Menu>
    </Layout.Sider>
  );
}
