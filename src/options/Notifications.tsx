import { Component, h } from '../dom';

export interface Notification {
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

export const Notifications = (props: { notifications: Notification[] }) => (
  <div>
    {props.notifications.map((notification) => <NotificationView notification={notification} />)}
  </div>
);

// TODO: Implement `fade-leave` animation
class NotificationView extends Component<{ notification: Notification }, {}> {
  componentDidMount() {
    if (!this.base) return;

    const el = this.base;
    el.classList.add('fade-enter');
    setTimeout(() => {
      el.classList.add('fade-enter-active');
    }, 0);
  }

  render(props: { notification: Notification }, state: {}) {
    return <div key={props.notification.timestamp} >{props.notification.message}</div>;
  }
}
