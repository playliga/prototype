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
  parent?: string;
  collapsed: boolean;
  logourl: string;
  config: RouteConfig[];
}


function navigateTo( historyobj: any, target: string ) {
  historyobj.push( target );
}


export default function Sidebar( props: Partial<RouteComponentProps> & Props ) {
  const path = props.match?.path;
  const parent = props.parent;

  return (
    <Layout.Sider
      collapsible
      className="sidebar"
      collapsed={props.collapsed}
      onCollapse={props.onCollapse}
    >
      <section className="logocontainer">
        <img src={props.logourl} alt="LIGA" />
      </section>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[ parent || path || '' ]}
        defaultOpenKeys={[ parent || '' ]}
      >
        {props.config.map( r => {
          const hasbadge = r.notifications;
          const badgeProps = {
            dot: typeof r.notifications === 'boolean',
            count: typeof r.notifications === 'number' ? r.notifications : null,
          };

          // render sub-menu if there is at least one to render
          const submenu = r.subroutes && r.subroutes.some( sr => sr.sidebar );

          if( submenu ) {
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
                ? !props.collapsed && <Badge {...badgeProps} />
                : null
              }
            </Menu.Item>
          );
        })}
      </Menu>
    </Layout.Sider>
  );
}
