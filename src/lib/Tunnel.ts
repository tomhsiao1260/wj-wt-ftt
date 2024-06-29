import PubSub from "pubsub-js";

const Tunnel = {
  send(id: string, data: any) {
    PubSub.publish(id, data);
  },
  on(id: string, handler: (data: any) => void) {
    const token = PubSub.subscribe(id, (msg, data) => {
      handler(data);
    });
    return () => {
      PubSub.unsubscribe(token);
    };
  },
};

export default Tunnel;
