import React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { Menu, Layout, Badge } from 'antd';
import { RouteConfig } from 'renderer/screens/main/types';
import './sidebar.scss';


/**
 * Collapsible navigation sidebar
 */


interface Props {
  onCollapse: ( collapsed: boolean ) => void;
  parentPath?: string;
  collapsed: boolean;
  logourl: string;
  config: RouteConfig[];
}


function navigateTo( historyobj: any, target: string ) {
  historyobj.push( target );
}


export default function Sidebar( props: Partial<RouteComponentProps> & Props ) {
  const path = props.match?.path;
  const parentpath = props.parentPath;

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
        selectedKeys={[ path || '' ]}
        defaultOpenKeys={[ parentpath || '' ]}
      >
        {props.config.map( r => {
          const hasbadge = r.notifications && r.notifications > 0;

          if( r.subroutes ) {
            return (
              <Menu.SubMenu
                key={r.path}
                title={r.title}
                icon={React.createElement( r.icon )}
              >
                {r.subroutes.map( sr => (
                  <Menu.Item
                    key={sr.path}
                    onClick={() => navigateTo( props.history, sr.id )}
                  >
                    {sr.title}
                  </Menu.Item>
                ))}
              </Menu.SubMenu>
            );
          }

          return (
            <Menu.Item
              key={r.path}
              title={r.title}
              onClick={() => navigateTo( props.history, r.id )}
              icon={
                <>
                  {React.createElement( r.icon )}
                  {props.collapsed && hasbadge
                    ? <Badge dot />
                    : null
                  }
                </>
              }
            >
              {r.title}
              {hasbadge
                ? !props.collapsed && <Badge count={r.notifications} />
                : null
              }
            </Menu.Item>
          );
        })}
      </Menu>
    </Layout.Sider>
  );
}
