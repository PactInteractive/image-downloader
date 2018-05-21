import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { Component } from '../dom';
import { transitionDuration } from '../style';

export interface Notification {
  type: 'success' | 'warning' | 'error';
  message: string;
}

export class Notifications extends Component<{ notifications: Notification[] }> {
  render() {
    const { props } = this;
    return (
      <TransitionGroup>
        {props.notifications.map((notification, index) => (
          <CSSTransition key={index} classNames="fade" timeout={transitionDuration}>
            <div>{notification.message}</div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    );
  }
}
