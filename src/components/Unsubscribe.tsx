
'use client';

const UnsubscribeButton = () => {
  const handleUnsubscribe = async () => {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      if (unsubscribed) {
        alert('🔕 Unsubscribed successfully');
      } else {
        alert('❌ Failed to unsubscribe');
      }
    } else {
      alert('🙅‍♂️ No active subscription found');
    }
  };

  return (
    <button
      onClick={handleUnsubscribe}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
    >
      Unsubscribe from Push
    </button>
  );
};

export default UnsubscribeButton;
