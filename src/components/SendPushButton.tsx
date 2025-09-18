'use client';

import api from "@/lib/axios";


const SendPushButton = () => {
  const sendPush = async () => {
    await api.post('/api/send-push', {
      title: '📦 Order Update!',
      body: 'Your order #1234 has been shipped 🚚',
    });

    alert('Push sent!');
  };

  return (
    <button
      className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
      onClick={sendPush}
    >
      Send Test Push
    </button>
  );
};

export default SendPushButton;
